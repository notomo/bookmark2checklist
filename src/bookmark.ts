import { default as browser } from "webextension-polyfill";
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";

const ROOT_NAME = "ALL";

type Node = Readonly<{
  id: string;
  name: string;
  url: string | undefined;
  children: Node[];
}>;

type FlatNode = Readonly<{
  id: string;
  name: string;
  url: string | undefined;
  depth: number;
}>;

function _collectDirectories(
  node: browser.Bookmarks.BookmarkTreeNode,
): Node[] {
  if (!node.children) {
    return [];
  }
  return [{
    id: node.id,
    name: node.title !== "" ? node.title : ROOT_NAME,
    url: node.url,
    children: node.children
      .flatMap((node) => {
        return _collectDirectories(node);
      }),
  }];
}

function flatten(node: Node, depth: number): FlatNode[] {
  const flatNode = {
    id: node.id,
    name: node.name,
    url: node.url,
    depth: depth,
  };
  return [
    flatNode,
    ...node.children.flatMap((child) => {
      return flatten(child, depth + 1);
    }),
  ];
}

export function BookmarkApp() {
  const [items, setItems] = useState<FlatNode[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string>("0");

  useEffect(() => {
    set();
  }, []);
  const set = async () => {
    const root = (await browser.bookmarks.getTree())[0];
    const node = _collectDirectories(root)[0];
    const flatNodes = flatten(node, 0);
    setItems(flatNodes);
  };

  return h("div", {
    style: { padding: "1em" },
  }, [
    h(
      "div",
      { style: { padding: "1em" } },
      h(
        "select",
        // deno-lint-ignore no-explicit-any
        { onChange: (e: any) => setCurrentNodeId(e.target?.value) },
        items.map((e) => BookmarkItem(e)),
      ),
    ),
    MarkdownBookmarkTree(currentNodeId),
  ]);
}

const SPACE = String.fromCharCode(8194);
function BookmarkItem(node: FlatNode) {
  return h(
    "option",
    { value: node.id },
    `${SPACE.repeat(node.depth * 2)}${node.name}`,
  );
}

function MarkdownBookmarkTree(nodeId: string) {
  const [items, setItems] = useState<FlatNode[]>([]);

  useEffect(() => {
    set();
  }, [nodeId]);
  const set = async () => {
    const root = (await browser.bookmarks.getSubTree(nodeId))[0];
    const flatNodes = flatten(_collect(root), -1).slice(1);
    setItems(flatNodes);
  };

  const text = items
    .map((node) => {
      const url = node.url ?? "";
      const prefix = `${" ".repeat(node.depth * 2)}- [ ] `;
      if (!url) {
        return `${prefix}${node.name}`;
      }
      return `${prefix}[${node.name}](${url})`;
    })
    .join("\n");
  return h("textarea", {
    readonly: true,
    wrap: "off",
    style: { width: "100%", height: "80vh", resize: "none" },
  }, text);
}

function _collect(
  node: browser.Bookmarks.BookmarkTreeNode,
): Node {
  return {
    id: node.id,
    name: node.title !== "" ? node.title : ROOT_NAME,
    url: node.url,
    children: (node.children ?? [])
      .flatMap((node) => {
        return _collect(node);
      }),
  };
}
