import { useState } from "react";
import { Plus, X, ExternalLink } from "lucide-react";

type Link = {
  label: string;
  text: string;
  url: string;
};

type VenueLinksProps = {
  tags?: string[];
  links?: Link[];
  onUpdateTags?: (newTags: string[]) => void;
  onUpdateLinks?: (newLinks: Link[]) => void;
};

const VenueLinks: React.FC<VenueLinksProps> = ({
  tags = [
    "#ClubVertex",
    "#NeonNights",
    "#DJNeonPulse",
    "#LiveMusic",
    "#LosAngeles",
  ],
  links = [
    { label: "MERCH", text: "Shop Collection", url: "#" },
    { label: "TICKETS", text: "Upcoming Events", url: "#" },
    { label: "PARTNERS", text: "View Sponsors", url: "#" },
    { label: "DRINKS", text: "Menu & Specials", url: "#" },
  ],
  onUpdateTags = () => {},
  onUpdateLinks = () => {},
}) => {
  // rest of your fire code...

  const [isEditingTags, setIsEditingTags] = useState(false);
  const [isEditingLinks, setIsEditingLinks] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newLink, setNewLink] = useState({ label: "", text: "", url: "" });

  const addTag = () => {
    if (newTag.trim()) {
      const formattedTag = newTag.startsWith("#") ? newTag : `#${newTag}`;
      onUpdateTags([...tags, formattedTag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onUpdateTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const addLink = () => {
    if (newLink.label.trim() && newLink.text.trim()) {
      onUpdateLinks([...links, { ...newLink }]);
      setNewLink({ label: "", text: "", url: "" });
    }
  };

  const removeLink = (indexToRemove: number) => {
    onUpdateLinks(links.filter((_, index) => index !== indexToRemove));
  };

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
              {tag}
            </span>
            {isEditingTags && (
              <button
                onClick={() => removeTag(tag)}
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
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag..."
              className="px-2 py-1 bg-gray-600 rounded text-sm text-white placeholder-gray-400 w-24"
              onKeyDown={(e) => e.key === "Enter" && addTag()}
            />
            <button
              onClick={addTag}
              className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
            >
              <Plus size={12} className="text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {links.map(({ label, text, url }, index) => (
          <div
            key={index}
            className="relative group p-3 bg-gray-700 rounded-md text-center hover:bg-gray-600 transition-colors cursor-pointer"
            onClick={() => url && url !== "#" && window.open(url, "_blank")}
          >
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-sm text-white">{text}</p>
            {url && url !== "#" && (
              <ExternalLink
                size={12}
                className="absolute top-1 right-1 text-gray-500"
              />
            )}
            {isEditingLinks && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeLink(index);
                }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
              value={newLink.label}
              onChange={(e) =>
                setNewLink({ ...newLink, label: e.target.value })
              }
              placeholder="Label"
              className="w-full mb-1 px-1 py-0.5 bg-gray-500 rounded text-xs text-white placeholder-gray-300"
            />
            <input
              type="text"
              value={newLink.text}
              onChange={(e) => setNewLink({ ...newLink, text: e.target.value })}
              placeholder="Display text"
              className="w-full mb-1 px-1 py-0.5 bg-gray-500 rounded text-xs text-white placeholder-gray-300"
            />
            <input
              type="url"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              placeholder="URL (optional)"
              className="w-full mb-2 px-1 py-0.5 bg-gray-500 rounded text-xs text-white placeholder-gray-300"
            />
            <button
              onClick={addLink}
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
