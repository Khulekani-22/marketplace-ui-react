import { useContext } from "react";
import { MessagesContext } from "./messagesContext";

export const useMessages = () => {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error("useMessages must be used inside <MessagesProvider />");
  return ctx;
};
