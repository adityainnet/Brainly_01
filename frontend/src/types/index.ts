export type ContentType =
  | "tweet"
  | "youtube"
  | "document"
  | "link"
  | "text";

export interface ITag {
  _id: string;
  name: string;
  userId?: string;
}

export interface IContent {
  _id: string;
  title: string;
  type: ContentType;
  link?: string;
  description?: string;
  userId: string | { _id: string; username: string };
  tags: (ITag | string)[];
  createdAt: string;
  updatedAt: string;
}

export interface IUser {
  id: string;
  username: string;
  email?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: IUser;
}
