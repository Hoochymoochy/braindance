import { useEffect, useState } from "react";
import { Plus, X, ExternalLink } from "lucide-react";

import { addLink, getLinks, deleteLink } from "@/app/lib/links";
import { addTag, getTags, deleteTag } from "@/app/lib/tags";
import { useParams } from "next/navigation";
import { ParamValue } from "next/dist/server/request/params";

type Link = {
  label: string;
  text: string;
  url: string;
  id: string;
};
type Tag = {
  tag: string;
  id: string;
}



type VenueLinksProps = {
  id: ParamValue;
};

const VenueLinks: React.FC<VenueLinksProps> = ({id}) => {
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [isEditingLinks, setIsEditingLinks] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [linkInput, setLinkInput] = useState({ label: "", text: "", url: "", id: "" });
  const [tags, setTags] = useState<Tag[]>([]);
  const [links, setLinks] = useState<Link[]>([]);

  const fetchDates = async () => {
    const tags = await getTags(id);
    const links = await getLinks(id);
    setTags(tags);
    setLinks(links);
  };

  const handleAddTag = async () => {
    await addTag(tagInput, id);
    fetchDates();
  };

  const handleAddLink = async () => {
    await addLink(linkInput, id);
    console.log(linkInput.label + " " + id);
    fetchDates();
  };

  const handleDeleteTag = async (id: string) => {
    await deleteTag(id);
    fetchDates();
  }

  const handleDeleteLink = async (id: string) => {
    await deleteLink(id);
    fetchDates();
  }

  useEffect(() => {
    fetchDates();
  }, [id]);

  return (

    <div className="mt-4 rounded-lg border border-gray-800 bg-gray-800/50 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-white">Venue Tags / Links</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditingTags(!isEditingTags)}
            className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded transition-colors"
          >
            {isEditingTags ? "Done" : "Edit Tags"}
          </button>
          <button
            onClick={() => setIsEditingLinks(!isEditingLinks)}
            className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            {isEditingLinks ? "Done" : "Edit Links"}
          </button>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag, index) => (
          <div key={index} className="relative group">
            <span className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300 hover:bg-gray-600 transition-colors">
              #{tag.tag}
            </span>
            {isEditingTags && (
              <button
                onClick={() => handleDeleteTag(tag.id)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} className="text-white" />
              </button>
            )}
          </div>
        ))}

        {isEditingTags && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add tag..."
              className="px-2 py-1 bg-gray-600 rounded text-sm text-white placeholder-gray-400 w-24"
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
            />
            <button
              onClick={handleAddTag}
              className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
            >
              <Plus size={12} className="text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {links.map(({ label, text, url, id }) => (
          <div key={id} className="relative group">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-gray-700 rounded-md text-center hover:bg-gray-600 transition-colors"
            >
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-sm text-white">{text}</p>

              {url && url !== "#" && (
                <ExternalLink
                  size={12}
                  className="absolute top-1 right-1 text-gray-500"
                />
              )}
            </a>

            {isEditingLinks && (
              <button
                onClick={(e) => {
                  e.preventDefault(); // stops <a> navigation
                  e.stopPropagation(); // stops bubbling
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
          <div className="p-3 bg-gray-600 rounded-md border-2 border-dashed border-gray-500">
            <input
              type="text"
              value={linkInput.label}
              onChange={(e) =>
                setLinkInput({ ...linkInput, label: e.target.value })
              }
              placeholder="Label"
              className="w-full mb-1 px-1 py-0.5 bg-gray-500 rounded text-xs text-white placeholder-gray-300"
            />
            <input
              type="text"
              value={linkInput.text}
              onChange={(e) => setLinkInput({ ...linkInput, text: e.target.value })}
              placeholder="Display text"
              className="w-full mb-1 px-1 py-0.5 bg-gray-500 rounded text-xs text-white placeholder-gray-300"
            />
            <input
              type="url"
              value={linkInput.url}
              onChange={(e) => setLinkInput({ ...linkInput, url: e.target.value })}
              placeholder="URL"
              className="w-full mb-2 px-1 py-0.5 bg-gray-500 rounded text-xs text-white placeholder-gray-300"
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
