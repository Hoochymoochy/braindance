"use client";
import { useState } from "react";

export default function EmailManager() {
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [message, setMessage] = useState("");

  const addEmail = () => {
    if (newEmail && !emails.includes(newEmail)) {
      setEmails((prev) => [...prev, newEmail]);
      setNewEmail("");
    }
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails((prev) => prev.filter((email) => email !== emailToRemove));
  };

  const sendEmails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emails.length || !message.trim()) {
      alert("Add emails and write a message first.");
      return;
    }

    const res = await fetch("/api/send-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails, message }),
    });

    if (res.ok) {
      alert("Invites sent!");
      setEmails([]);
      setMessage("");
    } else {
      alert("Something went wrong.");
    }
  };

  return (
    <div className="glass-bends max-w-xl space-y-6 rounded-xl p-6 text-white">
      <h2 className="text-xl font-semibold text-gradient-bends">
        Send Custom Email Invite
      </h2>

      <div className="flex space-x-2">
        <input
          type="email"
          className="input-bends flex-grow"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Add email"
        />
        <button
          type="button"
          onClick={addEmail}
          className="rounded bg-[#3700ff] px-4 text-white transition hover:bg-[#ff00f7]/85"
        >
          Add
        </button>
      </div>

      {emails.length > 0 && (
        <div className="glass-bends-card space-y-1 rounded-lg p-3">
          <p className="font-medium text-[#00ccff]/90">Recipients:</p>
          {emails.map((email) => (
            <div key={email} className="flex justify-between text-sm">
              <span>{email}</span>
              <button
                onClick={() => removeEmail(email)}
                className="text-red-400 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <textarea
        className="input-bends min-h-[120px] resize-y py-3"
        rows={5}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write your custom message here..."
      />

      <button
        onClick={sendEmails}
        className="rounded bg-[#3700ff] px-6 py-2 text-white transition hover:bg-[#ff00f7]/85"
      >
        Send Message
      </button>
    </div>
  );
}
