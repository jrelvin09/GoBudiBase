export interface PimsNavNode {
	id: string;
	label: string;
	parent: string;
	depth: number;
	href: string;
	pageId: string | null;
	icon: string;
	isExpandable: boolean;
	isLeaf: boolean;
	children?: PimsNavNode[];
}

export interface PimsUser {
	username: string;
	fullName: string;
	email: string;
	role: string;
	subsidiaryCode: string;
	subsidiaryName: string;
	lastLogin: string;
	ipAddress: string;
}
