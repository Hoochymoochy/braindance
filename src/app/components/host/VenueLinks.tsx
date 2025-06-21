"use client";

import { useEffect, useState, useCallback } from "react";
import { X, ExternalLink } from "lucide-react";

import { addLink, getLinks, deleteLink } from "@/app/lib/events/links";
import { ParamValue } from "next/dist/server/request/params";

type Link = {
  label: string;
  description: string;
  link: string;
  id: string;
};

type VenueLinksProps = {
  id: ParamValue;
};

const VenueLinks: React.FC<VenueLinksProps> = ({ id }) => {
  const [isEditingLinks, setIsEditingLinks] = useState(false);
  const [linkInput, setLinkInput] = useState({
    label: "",
    description: "",
    link: "",
    id: "",
  });
  const [links, setLinks] = useState<Link[]>([]);

  const fetchLinks = useCallback(async () => {
    const data = await getLinks(id as string);
    setLinks(data);
  }, [id]);

  const handleAddLink = async () => {
    await addLink(id as string, linkInput);
    await fetchLinks();
    setLinkInput({ label: "", description: "", link: "", id: "" });
  };

  const handleDeleteLink = async (linkId: string) => {
    await deleteLink(linkId);
    await fetchLinks();
  };

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  return (
    <div className="mt-6 rounded-lg border border-purple-900/50 bg-black/60 p-4 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          MERCH & TICKETS
        </h3>
        <button
          onClick={() => setIsEditingLinks(!isEditingLinks)}
          className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
        >
          {isEditingLinks ? "Done" : "Edit"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {links.map(({ label, description, link, id }) => (
          <div key={id} className="relative group">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-md text-center hover:from-purple-800/60 hover:to-pink-800/60 cursor-pointer transition-all transform hover:scale-105 block"
            >
              <p className="text-sm font-medium text-white">{label}</p>
              <p className="text-xs text-gray-400 mt-1">{description}</p>
              {link && (
                <ExternalLink
                  size={12}
                  className="absolute top-1 right-1 text-gray-400"
                />
              )}
            </a>

            {isEditingLinks && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteLink(id);
                }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X size={12} className="text-white" />
              </button>
            )}
          </div>
        ))}

        {isEditingLinks && (
          <div className="p-4 bg-zinc-800 border-2 border-dashed border-purple-500/30 rounded-md">
            <input
              type="text"
              value={linkInput.label}
              onChange={(e) =>
                setLinkInput({ ...linkInput, label: e.target.value })
              }
              placeholder="Label"
              className="w-full mb-2 px-2 py-1 bg-zinc-700 rounded text-xs text-white placeholder-gray-400"
            />
            <input
              type="text"
              value={linkInput.description}
              onChange={(e) =>
                setLinkInput({ ...linkInput, description: e.target.value })
              }
              placeholder="Description"
              className="w-full mb-2 px-2 py-1 bg-zinc-700 rounded text-xs text-white placeholder-gray-400"
            />
            <input
              type="url"
              value={linkInput.link}
              onChange={(e) =>
                setLinkInput({ ...linkInput, link: e.target.value })
              }
              placeholder="URL"
              className="w-full mb-3 px-2 py-1 bg-zinc-700 rounded text-xs text-white placeholder-gray-400"
            />
            <button
              onClick={handleAddLink}
              className="w-full py-1 bg-green-600 rounded text-xs hover:bg-green-700 transition-colors"
            >
              Add Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueLinks;
