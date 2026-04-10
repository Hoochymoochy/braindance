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
    <div className="glass-bends-card mt-6 rounded-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold text-gradient-bends">MERCH & TICKETS</h3>
        <button
          onClick={() => setIsEditingLinks(!isEditingLinks)}
          className="rounded px-2 py-1 text-xs transition-colors bg-[#00ccff]/25 text-[#00ccff] hover:bg-[#00ccff]/35"
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
              className="block transform cursor-pointer rounded-md border border-white/12 bg-gradient-to-br from-[#3700ff]/25 to-[#ff00f7]/15 p-4 text-center transition-all hover:scale-105 hover:border-[#00ccff]/35 hover:from-[#3700ff]/45 hover:to-[#00ccff]/20"
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
          <div className="rounded-md border-2 border-dashed border-[#00ccff]/25 bg-black/35 p-4">
            <input
              type="text"
              value={linkInput.label}
              onChange={(e) =>
                setLinkInput({ ...linkInput, label: e.target.value })
              }
              placeholder="Label"
              className="mb-2 w-full rounded px-2 py-1 text-xs text-white placeholder:text-white/40 bg-black/50 border border-white/10"
            />
            <input
              type="text"
              value={linkInput.description}
              onChange={(e) =>
                setLinkInput({ ...linkInput, description: e.target.value })
              }
              placeholder="Description"
              className="mb-2 w-full rounded px-2 py-1 text-xs text-white placeholder:text-white/40 bg-black/50 border border-white/10"
            />
            <input
              type="url"
              value={linkInput.link}
              onChange={(e) =>
                setLinkInput({ ...linkInput, link: e.target.value })
              }
              placeholder="URL"
              className="mb-3 w-full rounded px-2 py-1 text-xs text-white placeholder:text-white/40 bg-black/50 border border-white/10"
            />
            <button
              onClick={handleAddLink}
              className="w-full rounded bg-emerald-600/90 py-1 text-xs text-white transition-colors hover:bg-emerald-500"
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
