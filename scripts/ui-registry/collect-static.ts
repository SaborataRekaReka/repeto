import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

type RegistryElement = {
  id: string;
  route: string | null;
  page: string;
  area: string;
  widget: string;
  component: string;
  elementType: string;
  label: string | null;
  accessibleName: string | null;
  text: string | null;
  ariaLabel: string | null;
  placeholder: string | null;
  href: string | null;
  action: string | null;
  eventHandlers: string[];
  states: string[];
  source: {
    file: string;
    line: number;
    staticFound: boolean;
    runtimeFound: boolean;
  };
  runtime: {
    selector: string | null;
    role: string | null;
    visible: boolean | null;
    disabled: boolean | null;
  };
  quality: {
    hasAccessibleName: boolean;
    hasStableTestId: boolean;
    needsAriaLabel: boolean;
    needsAnalyticsEvent: boolean;
    risk: "low" | "medium" | "high";
  };
  notes: string;
  meta?: {
    importSource?: string | null;
    parentSection?: string | null;
    testId?: string | null;
  };
};

type ImportMap = Record<string, string>;

const ROOT = path.resolve(__dirname, "..", "..");
const FRONTEND = path.join(ROOT, "frontend-gravity");
const OUT_DIR = path.join(ROOT, "docs", "ui-registry");
const STATIC_OUT = path.join(OUT_DIR, "static-elements.json");

const TARGET_DIRS = [
  path.join(FRONTEND, "pages"),
  path.join(FRONTEND, "components"),
  path.join(FRONTEND, "templates"),
  path.join(FRONTEND, "contexts"),
];

const EXTS = new Set([".tsx", ".ts"]);
const INTERACTIVE_TAGS = new Set(["button", "a", "input", "textarea", "select", "form", "label"]);
const ROLE_SET = new Set(["button", "link", "menuitem", "tab", "switch", "checkbox", "radio", "dialog", "tooltip"]);
const CUSTOM_CONTROL_PATTERNS = [
  /Modal/i,
  /Panel/i,
  /Tabs?/i,
  /Toolbar/i,
  /QuickAction/i,
  /^Create[A-Z]/,
  /LessonPanel/i,
  /StudentCard/i,
  /Booking/i,
  /PublicProfile/i,
  /DropdownMenu/i,
];

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name);
    if (!EXTS.has(ext)) continue;
    out.push(full);
  }
  return out;
}

function rel(file: string): string {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function nodeLine(sf: ts.SourceFile, node: ts.Node): number {
  return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "unknown";
}

function inferRoute(file: string): string | null {
  const p = rel(file);
  const prefix = "frontend-gravity/pages/";
  if (!p.startsWith(prefix)) return null;
  const tail = p.slice(prefix.length);
  if (tail.startsWith("api/")) return null;
  let route = "/" + tail
    .replace(/\.tsx?$/, "")
    .replace(/\/index$/, "")
    .replace(/\[(.+?)\]/g, "{$1}");
  if (route === "/") return "/";
  route = route.replace(/\/+/g, "/");
  return route;
}

function inferPage(route: string | null, file: string): string {
  if (route) {
    if (route === "/") return "Home";
    const part = route.split("/").filter(Boolean).map((x) => x.replace(/[{}]/g, "")).join(" ");
    return part ? part.replace(/\b\w/g, (m) => m.toUpperCase()) : "Unknown";
  }
  const base = path.basename(file).replace(/\.tsx?$/, "");
  return base.replace(/\b\w/g, (m) => m.toUpperCase());
}

function classifyArea(route: string | null, widget: string): string {
  const r = route || "";
  const w = widget.toLowerCase();
  if (r.startsWith("/t/")) return r.endsWith("/book") ? "booking" : "public-profile";
  if (r.startsWith("/settings")) return "settings";
  if (r.startsWith("/finance") || r === "/payments" || r === "/packages") return "finance";
  if (r.startsWith("/auth") || r.startsWith("/registration") || r.startsWith("/login")) return "auth";
  if (w.includes("modal") || w.includes("dialog")) return "modal";
  if (w.includes("sidebar") || w.includes("nav") || w.includes("layout")) return "sidebar";
  if (w.includes("header")) return "top-header";
  return "main";
}

function isJsxNameText(name: ts.JsxTagNameExpression): string {
  if (ts.isIdentifier(name)) return name.text;
  if (ts.isPropertyAccessExpression(name)) return name.name.text;
  return name.getText();
}

function exprText(expr: ts.Expression | undefined): string | null {
  if (!expr) return null;
  if (ts.isStringLiteralLike(expr)) return expr.text;
  if (ts.isNoSubstitutionTemplateLiteral(expr)) return expr.text;
  if (ts.isTemplateExpression(expr)) return expr.getText();
  if (ts.isIdentifier(expr)) return expr.text;
  return expr.getText();
}

function attrMap(attrs: ts.JsxAttributes): Record<string, string | null> {
  const map: Record<string, string | null> = {};
  for (const item of attrs.properties) {
    if (!ts.isJsxAttribute(item)) continue;
    const key = item.name.text;
    if (!item.initializer) {
      map[key] = "true";
      continue;
    }
    if (ts.isStringLiteral(item.initializer)) {
      map[key] = item.initializer.text;
      continue;
    }
    if (ts.isJsxExpression(item.initializer)) {
      map[key] = exprText(item.initializer.expression);
      continue;
    }
    map[key] = item.initializer.getText();
  }
  return map;
}

function collectImports(sf: ts.SourceFile): ImportMap {
  const imports: ImportMap = {};
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt)) continue;
    const source = (stmt.moduleSpecifier as ts.StringLiteral).text;
    const clause = stmt.importClause;
    if (!clause) continue;
    if (clause.name) imports[clause.name.text] = source;
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const el of clause.namedBindings.elements) {
        imports[el.name.text] = source;
      }
    }
  }
  return imports;
}

function isControlComponent(name: string, imports: ImportMap): boolean {
  if (["Link", "Button", "TextInput", "Checkbox", "Switch", "Radio", "SegmentedRadioGroup", "DropdownMenu"].includes(name)) {
    return true;
  }
  if (CUSTOM_CONTROL_PATTERNS.some((re) => re.test(name))) return true;
  const source = imports[name] || "";
  return source.includes("@gravity-ui/uikit");
}

function extractText(node: ts.Node): string {
  if (ts.isJsxText(node)) return node.getText().trim();
  if (ts.isJsxExpression(node)) return exprText(node.expression || undefined) || "";
  if (ts.isJsxElement(node)) {
    return node.children.map((c) => extractText(c)).join(" ").replace(/\s+/g, " ").trim();
  }
  return "";
}

function accessibleRisk(elementType: string, label: string | null, ariaLabel: string | null): "low" | "medium" | "high" {
  const interactive = ["button", "link", "input", "tab", "switch", "checkbox", "radio", "menuitem"].includes(elementType);
  if (!interactive) return "low";
  if (label || ariaLabel) return "low";
  if (["input", "switch", "checkbox", "radio"].includes(elementType)) return "medium";
  return "high";
}

function guessElementType(name: string, attrs: Record<string, string | null>): string {
  const n = name.toLowerCase();
  if (n === "a" || n === "link") return "link";
  if (n === "form") return "form";
  if (n === "input" || n === "textarea" || n === "select" || n === "textinput") return "input";
  if (n.includes("tab")) return "tab";
  if (n.includes("switch")) return "switch";
  if (n.includes("checkbox")) return "checkbox";
  if (n.includes("radio")) return "radio";
  if (n.includes("modal") || n.includes("dialog") || attrs.role === "dialog") return "modal";
  if (attrs.role && ROLE_SET.has(attrs.role)) return attrs.role;
  if (n.includes("dropdown") || attrs.role === "menuitem") return "menuitem";
  if (n.includes("widget") || n.includes("card") || n.includes("panel")) return "widget";
  return "button";
}

function makeId(route: string | null, widget: string, label: string | null, elementType: string, index: number): string {
  const routePart = route ? slugify(route.replace(/[{}]/g, "")) : "shared";
  const widgetPart = slugify(widget || "unknown");
  const labelPart = slugify(label || `item-${index}`);
  return `ui.${routePart}.${widgetPart}.${labelPart}.${elementType}`;
}

function parentWidgetName(stack: string[]): string {
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    const item = stack[i];
    if (/^[A-Z]/.test(item)) return item;
  }
  return "unknown";
}

function collectStaticElements(file: string): RegistryElement[] {
  const source = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const imports = collectImports(sf);
  const route = inferRoute(file);
  const page = inferPage(route, file);
  const stack: string[] = [];
  const out: RegistryElement[] = [];
  let localIndex = 0;

  const visit = (node: ts.Node) => {
    if (ts.isJsxElement(node)) {
      const name = isJsxNameText(node.openingElement.tagName);
      stack.push(name);
      handleNode(name, node.openingElement.attributes, node.children, node);
      node.children.forEach(visit);
      stack.pop();
      return;
    }

    if (ts.isJsxSelfClosingElement(node)) {
      const name = isJsxNameText(node.tagName);
      stack.push(name);
      handleNode(name, node.attributes, [], node);
      stack.pop();
      return;
    }

    ts.forEachChild(node, visit);
  };

  const handleNode = (
    name: string,
    attributes: ts.JsxAttributes,
    children: readonly ts.JsxChild[],
    node: ts.Node,
  ) => {
    const lower = name.toLowerCase();
    const attrs = attrMap(attributes);
    const isIntrinsic = INTERACTIVE_TAGS.has(lower);
    const isCustomControl = !isIntrinsic && isControlComponent(name, imports);
    const hasRole = !!attrs.role && ROLE_SET.has(String(attrs.role));

    if (!isIntrinsic && !isCustomControl && !hasRole) return;

    const rawText = children.map((c) => extractText(c)).join(" ").replace(/\s+/g, " ").trim() || null;
    const ariaLabel = attrs["aria-label"] || null;
    const placeholder = attrs.placeholder || null;
    const href = attrs.href || null;
    const role = attrs.role || null;
    const label = rawText || ariaLabel || placeholder || (attrs.title || null);
    const accessibleName = ariaLabel || rawText || attrs.title || placeholder || null;
    const elementType = guessElementType(name, attrs);
    const widget = parentWidgetName(stack);
    const action = attrs.onClick || attrs.onSubmit || attrs.onChange || attrs.onKeyDown || null;
    const handlers = ["onClick", "onSubmit", "onChange", "onKeyDown"].filter((h) => attrs[h]);
    const states = [
      attrs.disabled ? "disabled" : "default",
      attrs.loading ? "loading" : "idle",
    ];
    const importSource = imports[name] || null;
    const hasStableTestId = Boolean(attrs["data-testid"]);
    const risk = accessibleRisk(elementType, label, ariaLabel);
    const hasAccessibleName = Boolean(accessibleName);

    out.push({
      id: makeId(route, widget, label, elementType, localIndex++),
      route,
      page,
      area: classifyArea(route, widget),
      widget,
      component: name,
      elementType,
      label,
      accessibleName,
      text: rawText,
      ariaLabel,
      placeholder,
      href,
      action,
      eventHandlers: handlers,
      states,
      source: {
        file: rel(file),
        line: nodeLine(sf, node),
        staticFound: true,
        runtimeFound: false,
      },
      runtime: {
        selector: null,
        role,
        visible: null,
        disabled: attrs.disabled === "true",
      },
      quality: {
        hasAccessibleName,
        hasStableTestId,
        needsAriaLabel: !hasAccessibleName && ["button", "link", "tab", "menuitem"].includes(elementType),
        needsAnalyticsEvent: ["button", "link", "tab", "switch", "checkbox", "radio", "menuitem"].includes(elementType),
        risk,
      },
      notes: "",
      meta: {
        importSource,
        parentSection: widget,
        testId: attrs["data-testid"] || null,
      },
    });
  };

  visit(sf);
  return out;
}

function main() {
  const files = TARGET_DIRS.flatMap((d) => walk(d));
  const elements = files.flatMap((file) => collectStaticElements(file));
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    STATIC_OUT,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: "static",
        filesScanned: files.length,
        elementsCount: elements.length,
        elements,
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`[ui-registry] static complete: ${elements.length} elements from ${files.length} files`);
}

main();
