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
    <div className="bg-white p-6 rounded-xl shadow space-y-6 max-w-xl">
      <h2 className="text-xl font-semibold">Send Custom Email Invite</h2>

      <div className="flex space-x-2">
        <input
          type="email"
          className="border rounded p-2 flex-grow"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Add email"
        />
        <button
          type="button"
          onClick={addEmail}
          className="bg-purple-600 text-white px-4 rounded hover:bg-purple-700"
        >
          Add
        </button>
      </div>

      {emails.length > 0 && (
        <div className="bg-gray-100 p-3 rounded space-y-1">
          <p className="font-medium">Recipients:</p>
          {emails.map((email) => (
            <div key={email} className="flex justify-between text-sm">
              <span>{email}</span>
              <button
                onClick={() => removeEmail(email)}
                className="text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <textarea
        className="w-full border rounded p-2"
        rows={5}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write your custom message here..."
      />

      <button
        onClick={sendEmails}
        className="bg-purple-700 text-white px-6 py-2 rounded hover:bg-purple-800"
      >
        Send Message
      </button>
    </div>
  );
}
