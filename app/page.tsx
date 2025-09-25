"use client";
import Image from "next/image";
import Chat from "./components/Chat";
import { useState } from "react";

export default function Home() {
  return (
    <div className="w-screen h-screen overflow-hidden">
      <Chat />
    </div>
  );
}