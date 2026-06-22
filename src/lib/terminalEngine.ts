import type { Mission, ValidationRule, VirtualFileSystem, VirtualNode } from "./types";

type TerminalMessageKey =
  | "terminal.commandLocked"
  | "terminal.commandNotFound"
  | "terminal.lsCannotAccess"
  | "terminal.cdNoDirectory"
  | "terminal.mkdirCannotCreate"
  | "terminal.touchCannotTouch"
  | "terminal.echoInvalidRedirect"
  | "terminal.catNotFile"
  | "terminal.cpUnable"
  | "terminal.mvUnable"
  | "terminal.rmCannotRemove"
  | "terminal.mockedCommand";

type TerminalTranslator = (key: TerminalMessageKey, params?: Record<string, string>) => string;

const fallbackTranslate: TerminalTranslator = (key, params = {}) => {
  const messages: Record<TerminalMessageKey, string> = {
    "terminal.commandLocked": "{command}: command locked for this mission",
    "terminal.commandNotFound": "command not found: {command}",
    "terminal.lsCannotAccess": "ls: cannot access path",
    "terminal.cdNoDirectory": "cd: no such directory: {path}",
    "terminal.mkdirCannotCreate": "mkdir: cannot create directory '{path}'",
    "terminal.touchCannotTouch": "touch: cannot touch '{path}'",
    "terminal.echoInvalidRedirect": "echo: invalid redirect target",
    "terminal.catNotFile": "cat: {path}: not a file",
    "terminal.cpUnable": "cp: unable to copy",
    "terminal.mvUnable": "mv: unable to move",
    "terminal.rmCannotRemove": "rm: cannot remove '{path}'",
    "terminal.mockedCommand": "{command}: mocked command is not implemented in this MVP",
  };
  return Object.entries(params).reduce((message, [name, value]) => message.replaceAll(`{${name}}`, value), messages[key]);
};

export type TerminalLine = {
  type: "input" | "output" | "system";
  text: string;
};

export type TerminalState = {
  cwd: string;
  fs: VirtualFileSystem;
  history: string[];
  output: TerminalLine[];
  user: string;
  host: string;
  cleared: boolean;
};

export type CommandResult = {
  state: TerminalState;
  completed: boolean;
  validation: { passed: boolean; rule: ValidationRule }[];
};

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const normalizePath = (path: string) => {
  const isAbsolute = path.startsWith("/");
  const parts = path.split("/").filter(Boolean);
  const stack: string[] = [];
  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return `${isAbsolute ? "/" : ""}${stack.join("/")}` || "/";
};

const resolvePath = (cwd: string, target = ".") => normalizePath(target.startsWith("/") ? target : `${cwd}/${target}`);

const getRootEntry = (fs: VirtualFileSystem) => Object.entries(fs)[0];

const getNode = (fs: VirtualFileSystem, path: string): VirtualNode | undefined => {
  const normalized = normalizePath(path);
  const [rootPath, rootNode] = getRootEntry(fs);
  if (normalized === rootPath) return rootNode;
  if (!normalized.startsWith(`${rootPath}/`)) return undefined;
  const parts = normalized.slice(rootPath.length + 1).split("/").filter(Boolean);
  let current: VirtualNode = rootNode;
  for (const part of parts) {
    if (typeof current === "string") return undefined;
    current = current[part];
    if (current === undefined) return undefined;
  }
  return current;
};

const getParent = (fs: VirtualFileSystem, path: string) => {
  const normalized = normalizePath(path);
  const parentPath = normalized.split("/").slice(0, -1).join("/") || "/";
  const name = normalized.split("/").filter(Boolean).at(-1) ?? "";
  const parent = getNode(fs, parentPath);
  if (!parent || typeof parent === "string") return undefined;
  return { parent, name, parentPath };
};

const setNode = (fs: VirtualFileSystem, path: string, node: VirtualNode) => {
  const target = getParent(fs, path);
  if (!target || !target.name) return false;
  target.parent[target.name] = node;
  return true;
};

const deleteNode = (fs: VirtualFileSystem, path: string) => {
  const target = getParent(fs, path);
  if (!target || !target.name || target.parent[target.name] === undefined) return false;
  delete target.parent[target.name];
  return true;
};

const listDirectory = (node: VirtualNode) => {
  if (typeof node === "string") return "";
  return Object.keys(node)
    .sort((a, b) => a.localeCompare(b))
    .join("  ");
};

const baseCommand = (input: string) => input.trim().split(/\s+/)[0] ?? "";

const parseArgs = (input: string) => input.match(/"[^"]*"|'[^']*'|\S+/g)?.map((part) => part.replace(/^["']|["']$/g, "")) ?? [];

const dirname = (path: string) => {
  const parts = path.split("/");
  parts.pop();
  return parts.join("/") || "/";
};

export class TerminalEngine {
  static createState(mission: Mission): TerminalState {
    return {
      cwd: mission.startDirectory,
      fs: deepClone(mission.initialFilesystem),
      history: [],
      output: [{ type: "system", text: mission.briefing }],
      user: "bitbybit",
      host: mission.environmentId,
      cleared: false,
    };
  }

  static prompt(state: TerminalState) {
    const home = "/home/bitbybit";
    const compact = state.cwd === home ? "~" : state.cwd.startsWith(`${home}/`) ? `~/${state.cwd.slice(home.length + 1)}` : state.cwd;
    return `${state.user}@${state.host}:${compact}$`;
  }

  static completeInput(input: string, state: TerminalState, mission: Mission) {
    const endsWithSpace = /\s$/.test(input);
    const parts = input.split(/\s+/);
    const commandPart = parts[0] ?? "";
    if (parts.length === 1 && !endsWithSpace) {
      const matches = mission.unlockedCommands.filter((command) => command.startsWith(commandPart));
      if (matches.length === 1) return `${matches[0]} `;
      return input;
    }

    const targetIndex = parts.length - 1;
    const partial = endsWithSpace ? "" : parts[targetIndex] ?? "";
    const basePath = partial.includes("/") ? dirname(partial) : ".";
    const partialName = partial.includes("/") ? partial.split("/").at(-1) ?? "" : partial;
    const resolvedBase = resolvePath(state.cwd, basePath);
    const node = getNode(state.fs, resolvedBase);
    if (!node || typeof node === "string") return input;
    const matches = Object.keys(node).filter((name) => name.startsWith(partialName));
    if (matches.length !== 1) return input;
    const completed = partial.includes("/") ? `${basePath === "." ? "" : `${basePath}/`}${matches[0]}` : matches[0];
    const suffix = typeof node[matches[0]] === "string" ? " " : "/";
    const nextParts = [...parts];
    if (endsWithSpace) nextParts.push(`${completed}${suffix}`);
    else nextParts[targetIndex] = `${completed}${suffix}`;
    return nextParts.join(" ");
  }

  static run(input: string, state: TerminalState, mission: Mission, translate: TerminalTranslator = fallbackTranslate): CommandResult {
    const trimmed = input.trim();
    if (!trimmed) return { state, completed: TerminalEngine.isComplete(state, mission), validation: TerminalEngine.validate(state, mission) };

    const command = baseCommand(trimmed);
    const next: TerminalState = {
      ...state,
      fs: deepClone(state.fs),
      history: [...state.history, trimmed],
      output: [...state.output, { type: "input", text: `${TerminalEngine.prompt(state)} ${trimmed}` }],
      cleared: false,
    };

    const knownCommands = new Set(["pwd", "ls", "cd", "clear", "whoami", "mkdir", "touch", "echo", "cat", "cp", "mv", "rm", "apt", "pacman", "dnf", "brew", "winget", "chmod", "chown", "ps", "kill", "systemctl", "ping", "curl", "ssh", "scp", "grep", "find", "tar", "unzip", "bash"]);
    if (!knownCommands.has(command)) {
      next.output.push({ type: "output", text: translate("terminal.commandNotFound", { command }) });
      return TerminalEngine.finish(next, mission);
    }

    if (!mission.unlockedCommands.includes(command)) {
      next.output.push({ type: "output", text: translate("terminal.commandLocked", { command }) });
      return TerminalEngine.finish(next, mission);
    }

    const args = parseArgs(trimmed).slice(1);
    switch (command) {
      case "pwd":
        next.output.push({ type: "output", text: next.cwd });
        break;
      case "whoami":
        next.output.push({ type: "output", text: next.user });
        break;
      case "clear":
        next.output = [];
        next.cleared = true;
        break;
      case "ls": {
        const node = getNode(next.fs, resolvePath(next.cwd, args[0]));
        next.output.push({ type: "output", text: node === undefined ? translate("terminal.lsCannotAccess") : listDirectory(node) });
        break;
      }
      case "cd": {
        const target = resolvePath(next.cwd, args[0] ?? "/home/bitbybit");
        const node = getNode(next.fs, target);
        if (node && typeof node !== "string") next.cwd = target;
        else next.output.push({ type: "output", text: translate("terminal.cdNoDirectory", { path: args[0] ?? "" }) });
        break;
      }
      case "mkdir":
        for (const arg of args) {
          if (!setNode(next.fs, resolvePath(next.cwd, arg), {})) next.output.push({ type: "output", text: translate("terminal.mkdirCannotCreate", { path: arg }) });
        }
        break;
      case "touch":
        for (const arg of args) {
          const path = resolvePath(next.cwd, arg);
          if (getNode(next.fs, path) === undefined && !setNode(next.fs, path, "")) {
            next.output.push({ type: "output", text: translate("terminal.touchCannotTouch", { path: arg }) });
          }
        }
        break;
      case "echo": {
        const redirectIndex = args.indexOf(">");
        const appendIndex = args.indexOf(">>");
        const operatorIndex = redirectIndex >= 0 ? redirectIndex : appendIndex;
        if (operatorIndex >= 0) {
          const text = args.slice(0, operatorIndex).join(" ");
          const path = args[operatorIndex + 1];
          const resolved = resolvePath(next.cwd, path);
          const current = appendIndex >= 0 ? getNode(next.fs, resolved) : undefined;
          const nextText = appendIndex >= 0 && typeof current === "string" && current.length ? `${current}\n${text}` : text;
          if (!path || !setNode(next.fs, resolved, nextText)) next.output.push({ type: "output", text: translate("terminal.echoInvalidRedirect") });
        } else {
          next.output.push({ type: "output", text: args.join(" ") });
        }
        break;
      }
      case "cat":
        for (const arg of args) {
          const node = getNode(next.fs, resolvePath(next.cwd, arg));
          next.output.push({ type: "output", text: typeof node === "string" ? node : translate("terminal.catNotFile", { path: arg }) });
        }
        break;
      case "cp": {
        const [from, to] = args;
        const node = getNode(next.fs, resolvePath(next.cwd, from));
        if (node === undefined || !setNode(next.fs, resolvePath(next.cwd, to), deepClone(node))) next.output.push({ type: "output", text: translate("terminal.cpUnable") });
        break;
      }
      case "mv": {
        const [from, to] = args;
        const source = resolvePath(next.cwd, from);
        const node = getNode(next.fs, source);
        if (node === undefined || !setNode(next.fs, resolvePath(next.cwd, to), deepClone(node)) || !deleteNode(next.fs, source)) {
          next.output.push({ type: "output", text: translate("terminal.mvUnable") });
        }
        break;
      }
      case "rm":
        for (const arg of args.filter((item) => !item.startsWith("-"))) {
          if (!deleteNode(next.fs, resolvePath(next.cwd, arg))) next.output.push({ type: "output", text: translate("terminal.rmCannotRemove", { path: arg }) });
        }
        break;
      default:
        next.output.push({ type: "output", text: translate("terminal.mockedCommand", { command }) });
    }

    return TerminalEngine.finish(next, mission);
  }

  static validate(state: TerminalState, mission: Mission) {
    return mission.validationRules.map((rule) => ({ rule, passed: TerminalEngine.passes(rule, state) }));
  }

  static isComplete(state: TerminalState, mission: Mission) {
    return TerminalEngine.validate(state, mission).every((result) => result.passed);
  }

  private static finish(state: TerminalState, mission: Mission): CommandResult {
    const validation = TerminalEngine.validate(state, mission);
    return { state, validation, completed: validation.every((result) => result.passed) };
  }

  private static passes(rule: ValidationRule, state: TerminalState) {
    switch (rule.type) {
      case "historyIncludes":
        return state.history.some((entry) => baseCommand(entry) === rule.command);
      case "cwdEquals":
        return state.cwd === rule.path;
      case "pathExists": {
        const node = getNode(state.fs, rule.path);
        if (node === undefined) return false;
        if (rule.nodeType === "file") return typeof node === "string";
        if (rule.nodeType === "directory") return typeof node !== "string";
        return true;
      }
      case "fileContains": {
        const node = getNode(state.fs, rule.path);
        return typeof node === "string" && node.includes(rule.text);
      }
      case "catRead":
        return state.history.some((entry) => {
          const args = parseArgs(entry);
          return args[0] === "cat" && args.slice(1).some((arg) => resolvePath(state.cwd, arg) === rule.path || arg === rule.path || arg.endsWith(rule.path.split("/").at(-1) ?? ""));
        });
      default:
        return false;
    }
  }
}
