import React, { useState, useRef, useEffect } from "react";

const MainModal = ({
  isOpen,
  onClose,
  onSubmit,
  register,
  handleSubmit,
  errors,
  schemas,
  openSchemaModal,
  deleteSchemaRow,
  roles,
  editingTemplateIndex,
}) => {
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsRoleDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRoleSelection = (roleId) => {
    if (selectedRoles.includes(roleId)) {
      setSelectedRoles(selectedRoles.filter((id) => id !== roleId));
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  const handleFormSubmit = (data) => {
    if (selectedRoles.length === 0) {
      alert("At least one role must be selected");
      return;
    }

    data.role = selectedRoles;
    onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4 text-gray-500">Add/Edit Proof Template</h3>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="grid grid-cols-2 gap-4 mb-4 text-gray-500">
            <div>
              <label htmlFor="templateName" className="block text-sm font-medium text-gray-500 mb-2">
                Template Name
              </label>
              <input
                id="templateName"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400 hover:border-emerald-400 transition duration-200"
                placeholder="Template Name"
                {...register("template_name", { required: "Template Name is required" })}
              />
              {errors.template_name && (
                <p className="text-red-500 text-sm">{errors.template_name.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="templateId" className="block text-sm font-medium text-gray-500 mb-2">
                Template ID
              </label>
              <input
                id="templateId"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400 hover:border-emerald-400 transition duration-200"
                placeholder="Template ID"
                {...register("template_id", { required: "Template ID is required" })}
              />
              {errors.template_id && (
                <p className="text-red-500 text-sm">{errors.template_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-500 mb-2">
                Role
              </label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400 hover:border-emerald-400 transition duration-200 text-left"
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                >
                  {selectedRoles.length > 0
                    ? `${selectedRoles.length} roles selected`
                    : "Select roles"}
                </button>
                {isRoleDropdownOpen && (
                  <div className="absolute z-10 mt-2 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleRoleSelection(role.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRoles.includes(role.id)}
                          readOnly
                          className="mr-2"
                        />
                        <span>{`${role.id}: ${role.role}`}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedRoles.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  <b>Selected Roles:</b>{" "}
                  {roles
                    .filter((role) => selectedRoles.includes(role.id))
                    .map((role) => role.role)
                    .join(", ")}
                </p>
              )}
              {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
            </div>
            <div>
              <label htmlFor="version" className="block text-sm font-medium text-gray-500 mb-2">
                Version
              </label>
              <input
                id="version"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400 hover:border-emerald-400 transition duration-200"
                placeholder="Version (e.g., 1.0.0)"
                {...register("version", {
                  required: "Version is required",
                  pattern: {
                    value: /^\d+\.\d+\.\d+$/,
                    message: "Version must follow Semantic Versioning (e.g., 1.0.0)",
                  },
                })}
              />
              {errors.version && (
                <p className="text-red-500 text-sm">{errors.version.message}</p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-500 mb-2">
              Description
            </label>
            <textarea
              id="description"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400 hover:border-emerald-400 transition duration-200"
              placeholder="Description"
              {...register("description", { required: "Description is required" })}
            />
            {errors.description && (
              <p className="text-red-500 text-sm">{errors.description.message}</p>
            )}
          </div>

          <div className="mb-4">
            <h4 className="text-lg font-semibold mb-2">Schemas</h4>
            <div className="overflow-hidden rounded-lg border border-gray-300">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-200">
                    <th className="border p-2">Schema Name</th>
                    <th className="border p-2">Schema ID</th>
                    <th className="border p-2">Version</th>
                    <th className="border p-2">Attributes</th>
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schemas.map((schemaGroup, groupIndex) => (
                    schemaGroup.schemas.map((schema, schemaIndex) => (
                      <tr key={`${groupIndex}-${schemaIndex}`} className="border-b">
                        <td className="border p-2">{schema.schemaName}</td>
                        <td className="border p-2 text-sm font-mono">{schema.schemaId}</td>
                        <td className="border p-2">{schema.version}</td>
                        <td className="border p-2">
                          <div className="flex flex-wrap gap-1">
                            {schema.attributeNames.map((attr, idx) => (
                              <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                {attr}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="border p-2 text-center">
                          <button
                            className="text-red-500 border border-red-500 px-2 py-1 rounded text-xs md:text-sm font-medium hover:bg-red-50 transition-colors"
                            onClick={() => deleteSchemaRow(groupIndex)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
            </div>
            <button
              className="bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-bold mt-4 hover:bg-emerald-600 transition-colors"
              onClick={(e) => { e.preventDefault(); openSchemaModal(); }}
            >
              Add Schema
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <button
              className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
              {editingTemplateIndex !== null ? "Update" : "Create"} Proof Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MainModal;