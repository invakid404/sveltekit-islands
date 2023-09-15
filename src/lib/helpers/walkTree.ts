export type TreeNode = Record<string, unknown> & {
	children?: TreeNode[];
};

export const walkTree = <T extends TreeNode>(node: T, callback: (node: T) => void) => {
	callback(node);

	node.children?.forEach((child) => walkTree(child as never, callback));
};
