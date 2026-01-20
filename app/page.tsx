import { ChatInterface } from "@/components/chat-interface";

export default function Home() {
  return (
    <main className="h-screen bg-[#030712] flex relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Chat Interface with Sidebar */}
      <div className="flex-1 flex relative z-10">
        <ChatInterface />
      </div>
    </main>
  );
}
