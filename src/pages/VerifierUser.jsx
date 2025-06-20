import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TableComponent from "../components/layout/TableComponent";
import { useAuth } from "../context/AuthContext";
import { v4 as uuidv4 } from 'uuid';

const VerifierUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [errorRoles, setErrorRoles] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [confirmSendInvitation, setConfirmSendInvitation] = useState({ open: false, user: null });
  const [globalFilter, setGlobalFilter] = useState("");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedUserForStatus, setSelectedUserForStatus] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("ACTIVE");
  const [userIdExists, setUserIdExists] = useState(false);
  const [userIdChecking, setUserIdChecking] = useState(false);
  const [isSendingInvitation, setIsSendingInvitation] = useState(false);
  const [generatedUsername, setGeneratedUsername] = useState(""); // New state for generated username

  const { isAuthenticated } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      user_id: "",
      email: "",
      foundationID: "",
      role: "",
      status: "ACTIVE",
    },
  });

  const watchFirstName = watch("first_name");
  const watchLastName = watch("last_name");

  // Generate username when first/last name changes
  useEffect(() => {
    if (watchFirstName || watchLastName) {
      const newUsername = `${watchFirstName || ''}_${watchLastName || ''}_${uuidv4().substring(0, 8)}`.toLowerCase();
      setGeneratedUsername(newUsername);
    } else {
      setGeneratedUsername("");
    }
  }, [watchFirstName, watchLastName]);

  const playSound = (soundFile) => {
    const audio = new Audio(soundFile);
    audio.play();
  };
  const base_api_url = import.meta.env.VITE_API_BASE_URL;

  const checkUserIdExists = async (userId) => {
    const token = localStorage.getItem("authToken");
    if (!token) return false;

    try {
      setUserIdChecking(true);
      const response = await fetch(`${base_api_url}/mobile-verifier/v1/verifier-user/check-userid?userId=${encodeURIComponent(userId)}`, {
        method: "GET",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to check user ID");
      }

      const result = await response.json();
      return result.exists;
    } catch (error) {
      console.error("Error checking user ID:", error);
      return false;
    } finally {
      setUserIdChecking(false);
    }
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      toast.error("You are not authenticated");
      return;
    }

    try {
      const response = await fetch(`${base_api_url}/mobile-verifier/v1/verifier-user?pageSize=300`, {
        method: "GET",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      console.log("Fetched users:", result);
      if (!response.ok) {
        //const errorText = await response.text();
        const errorText = result.error || "Failed to fetch users";
        throw new Error(`Failed to fetch users: ${errorText}`);
      }

      if (result.data && Array.isArray(result.data) && result.data.length > 1) {
        const users = result.data[1];
        setUsers(users);
      } else {
        toast.error("Invalid data format received from the server");
      }
    } catch (error) {
      playSound("/sounds/failure.mp3");
      toast.error(`${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("You are not authenticated");
      return;
    }
    
    try {
      const response = await fetch(`${base_api_url}/mobile-verifier/v1/verifier-role?pageSize=300`, {
        method: "GET",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch roles: ${errorText}`);
      }

      const result = await response.json();
      if (result.data && Array.isArray(result.data) && result.data.length > 1) {
        const roles = result.data[1];
        setRoles(roles);
      } else {
        toast.error("Invalid data format received from the server");
      }
    } catch (error) {
      setErrorRoles(error.message);
      playSound("/sounds/failure.mp3");
      toast.error("Failed to fetch roles");
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
      fetchRoles();
    }
  }, [isAuthenticated]);

  const openModal = (user = null) => {
    if (user) {
      const nameParts = user.username.split(" ");
      const first_name = nameParts[0] || "";
      const last_name = nameParts.slice(1).join(" ") || "";
      
      const roleValue = user.verifierRole ? `${user.verifierRole.id}:${user.verifierRole.role}` : "";
      
      const formValues = {
        first_name,
        last_name,
        user_id: user.userId || "",
        email: user.email,
        foundationID: user.foundationID,
        role: roleValue,
        status: user.statusId === 1 ? "CREATED" : user.statusId === 2 ? "INVITED" : user.statusId === 3 ? "ACTIVE" : user.statusId === 4 ? "SUSPENDED" : "REVOKED",
      };
      reset(formValues);
      setIsEditing(true);
      setEditingUserId(user.id);
    } else {
      reset({
        first_name: "",
        last_name: "",
        user_id: "",
        email: "",
        foundationID: "",
        role: "",
        status: "ACTIVE",
      });
      setIsEditing(false);
      setEditingUserId(null);
      setGeneratedUsername("");
    }
    setIsModalOpen(true);
    setErrorRoles(null);
    setUserIdExists(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset({
      first_name: "",
      last_name: "",
      user_id: "",
      email: "",
      foundationID: "",
      role: "",
      status: "ACTIVE",
    });
    setIsEditing(false);
    setEditingUserId(null);
    setUserIdExists(false);
    setGeneratedUsername("");
  };

  const onSubmit = async (data) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("You are not authenticated");
      return;
    }

    const username = data.user_id 
      ? data.user_id 
      : `${data.first_name}_${data.last_name}_${uuidv4().substring(0, 8)}`.toLowerCase();

    if (!data.first_name || !data.last_name || !data.foundationID || !data.role || !data.email) {
      playSound("/sounds/failure.mp3");
      toast.error("All fields are required!");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      playSound("/sounds/failure.mp3");
      toast.error("Invalid email format!");
      return;
    }

    const [roleId, roleName] = data.role.split(":");
    const selectedRole = roles.find((role) => role.id === parseInt(roleId));

    if (!selectedRole) {
      playSound("/sounds/failure.mp3");
      toast.error("Invalid role selected");
      return;
    }

    if (data.user_id && !isEditing) {
      const exists = await checkUserIdExists(data.user_id);
      if (exists) {
        setUserIdExists(true);
        playSound("/sounds/failure.mp3");
        toast.error("User ID already exists. Please choose a different one.");
        return;
      }
    }

    const payload = {
      username: username,
      foundationID: data.foundationID,
      email: data.email,
      verifierRoleId: selectedRole.id
    };

    try {
      if (isEditing) {
        const updateResponse = await fetch(`${base_api_url}/mobile-verifier/v1/verifier-user/${editingUserId}`, {
          method: "PATCH",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          throw new Error(`Failed to update user: ${errorText}`);
        }

        playSound("/sounds/success.mp3");
        toast.success("User updated successfully!");
      } else {
        const createResponse = await fetch(`${base_api_url}/mobile-verifier/v1/verifier-user`, {
          method: "POST",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!createResponse.ok) {
          throw new Error("Failed to create user");
        }

        const result = await createResponse.json();
        setUsers((prevUsers) => [...prevUsers, result.data]);
        playSound("/sounds/success.mp3");
        toast.success("User added successfully!");
      }
      closeModal();
      fetchUsers();
    } catch (error) {
      playSound("/sounds/failure.mp3");
      toast.error(`${error.message}`);
    }
  };

  const handleUserIdChange = async (e) => {
    const userId = e.target.value;
    if (userId && userId.length > 3) {
      const exists = await checkUserIdExists(userId);
      setUserIdExists(exists);
    } else {
      setUserIdExists(false);
    }
  };

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteUser = async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      toast.error("You are not authenticated");
      return;
    }

    try {
      const response = await fetch(`${base_api_url}/mobile-verifier/v1/verifier-user/${userToDelete.id}`, {
        method: "DELETE",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete user: ${errorText}`);
      }

      setUsers(users.filter((user) => user.id !== userToDelete.id));
      playSound("/sounds/success.mp3");
      toast.success("User deleted successfully!");
    } catch (error) {
      playSound("/sounds/failure.mp3");
      toast.error(`${error.message}`);
    } finally {
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const openConfirmationModal = (user) => {
    setConfirmSendInvitation({ open: true, user });
  };

  const handleSendInvitation = async () => {
    const token = localStorage.getItem("authToken");
    const user = confirmSendInvitation.user;

    if (!token) {
      toast.error("You are not authenticated");
      return;
    }

    setIsSendingInvitation(true);

    try {
      const response = await fetch(`${base_api_url}/mobile-verifier/v1/verifier-user/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: user.email
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send invitation: ${errorText}`);
      }

      playSound("/sounds/success.mp3");
      toast.success("Invitation email sent successfully!");
      
      // Close modal after successful send
      setConfirmSendInvitation({ open: false, user: null });
    } catch (error) {
      playSound("/sounds/failure.mp3");
      toast.error(`${error.message}`);
    } finally {
      setIsSendingInvitation(false);
      fetchUsers();
    }
  };

  const openStatusModal = (user) => {
    setSelectedUserForStatus(user);
    setSelectedStatus(
      user.statusId === 3 ? "ACTIVE" : 
      user.statusId === 4 ? "SUSPENDED" : 
      "REVOKED"
    );
    setIsStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    setIsStatusModalOpen(false);
    setSelectedUserForStatus(null);
    setSelectedStatus("ACTIVE");
  };

  const handleStatusUpdate = async () => {
    const token = localStorage.getItem("authToken");

    if (!token || !selectedUserForStatus) {
      toast.error("You are not authenticated or no user selected");
      return;
    }

    try {
      const response = await fetch(
        `${base_api_url}/mobile-verifier/v1/verifier-user/revoke_suspend?id=${
          encodeURIComponent(selectedUserForStatus.id)}&status=${encodeURIComponent(selectedStatus)}`,
        {
          method: "POST",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch roles: ${errorText}`);
      }
      playSound("/sounds/success.mp3");
      toast.success(`User status updated to ${selectedStatus}`);
      closeStatusModal();
      fetchUsers();
    } catch (error) {
      playSound("/sounds/failure.mp3");
      toast.error(`${error.message}`);
    }
  };

  const columns = [
    {
      header: "Foundation ID",
      accessorKey: "foundationID",
    },
    {
      header: "Username",
      accessorKey: "username",
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Role",
      accessorKey: "verifierRole.role",
    },
    {
      header: "Status",
      accessorKey: "statusId",
      cell: ({ row }) => {
        const statusId = row.original.statusId;
        let statusText = "Unknown";
        switch (statusId) {
          case 1:
            statusText = "CREATED";
            break;
          case 2:
            statusText = "INVITED";
            break;
          case 3:
            statusText = "ACTIVE";
            break;
          case 4:
            statusText = "SUSPENDED";
            break;
          case 5:
            statusText = "REVOKED";
            break;
          default:
            statusText = "Unknown";
        }
        return <span>{statusText}</span>;
      },
    },
    {
      header: "Invitation",
      id: "invite",
      cell: ({ row }) => {
        const statusId = row.original.statusId;
        return (
          <>
            {statusId <= 3 && (
              <button
                className="text-emerald-400 border border-emerald-400 px-2 py-1 rounded text-xs md:text-sm font-medium hover:bg-emerald-50 transition-colors"
                onClick={() => openConfirmationModal(row.original)}
              >
                Re-Invite
              </button>
            )}
            {statusId >= 4 && (
              <span className="text-blue-500 tex-bold">-</span>
            )}
          </>
        );
      },
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }) => { 
        const statusId = row.original.statusId;
        return (
        <div className="flex justify-start gap-4 px-1">
          {statusId !== 5 && (
          <button
            className="text-emerald-400 border border-emerald-400 px-1 py-1 rounded text-xs md:text-sm font-medium hover:bg-emerald-50 transition-colors"
            onClick={() => openStatusModal(row.original)}
          >
            Update Status
          </button> )}
        </div>
    )}
    },
  ];

  return (
    <div className="flex-1 mt-4 overflow-x-auto">
      <ToastContainer />
      <div className="flex flex-col md:flex-row gap-4 mb-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-500 mb-1">Search Users</label>
          <div className="relative w-full">
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search users..."
              className="w-full px-4 py-2 pl-10 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 hover:border-emerald-500 transition duration-200"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
        </div>
        <div className="flex items-end">
          <button
            className="bg-emerald-400 text-white px-6 py-1 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors h-[42px]"
            onClick={() => openModal()}
          >
            Add New User
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center pt-8 text-gray-500">Loading Users...</p>
      ) : users.length === 0 ? (
        <p className="text-center pt-4 text-red-400">No Users found</p>
      ) : (
        <TableComponent
          columns={columns}
          data={users}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
        />
      )}

      {/* Add/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 ">
            <h3 className="text-xl font-semibold mb-4 text-gray-500 text-center">{isEditing ? "Edit User" : "Add New User"}</h3>
            {errorRoles && (
              <div className="text-red-400 text-sm mb-4">Error loading roles: {errorRoles}</div>
            )}
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex gap-4 mb-4 text-gray-500">
                <div className="flex-1">
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-500 mb-2">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-emerald-500 transition duration-200"
                    {...register("first_name", { required: "First Name is required" })}
                  />
                  {errors.first_name && (
                    <p className="text-red-500 text-sm">{errors.first_name.message}</p>
                  )}
                </div>
                <div className="flex-1">
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-500 mb-2">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-emerald-500 transition duration-200"
                    {...register("last_name", { required: "Last Name is required" })}
                  />
                  {errors.last_name && (
                    <p className="text-red-500 text-sm">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="user_id" className="block text-sm font-medium text-gray-500 mb-2">
                  User ID (Optional)
                </label>
                <input
                  id="user_id"
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-emerald-500 transition duration-200"
                  {...register("user_id")}
                  onChange={handleUserIdChange}
                />
                {userIdExists && (
                  <p className="text-red-500 text-sm">User ID already exists. Please choose a different one.</p>
                )}
                {!isEditing && (
                  <div className="text-xs text-gray-500 mt-1">
                    <span>Name Suggestion: </span>
                    {generatedUsername ? (
                      <button
                        type="button"
                        className="text-emerald-600 hover:underline cursor-pointer bg-transparent border-none p-0"
                        onClick={() => {
                          setValue('user_id', generatedUsername);
                          handleUserIdChange({ target: { value: generatedUsername } });
                        }}
                      >
                        {generatedUsername}
                      </button>
                    ) : (
                      <span>Unique Identifier</span>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="foundationID" className="block text-sm font-medium text-gray-500 mb-2">
                  Foundation ID
                </label>
                <input
                  id="foundationID"
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-emerald-500 transition duration-200"
                  {...register("foundationID", { required: "Foundation ID is required" })}
                />
                {errors.foundationID && (
                  <p className="text-red-500 text-sm">{errors.foundationID.message}</p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-500 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-emerald-500 transition duration-200"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Invalid email format",
                    },
                  })}
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="role" className="block text-sm font-medium text-gray-500 mb-2">
                  Role
                </label>
                <Controller
                  name="role"
                  control={control}
                  rules={{ required: "Role is required" }}
                  render={({ field }) => (
                    <select
                      id="role"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-emerald-500 transition duration-200"
                      {...field}
                      disabled={loadingRoles}
                    >
                      <option value="" className="text-gray-500">Select Role</option>
                      {roles.map((role) => (
                        <option 
                          className="text-gray-500" 
                          key={role.id} 
                          value={`${role.id}:${role.role}`}
                        >
                          {role.id}: {role.role}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                  disabled={loadingRoles || errorRoles || userIdChecking || userIdExists}
                >
                  {isEditing ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="text-sm mb-4">Are you sure you want to delete {userToDelete?.username}?</p>
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                onClick={handleDeleteUser}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invitation Confirmation Modal */}
      {confirmSendInvitation.open && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Confirm Invitation</h3>
            <p className="text-sm mb-4">
              Are you sure you want to send an invitation to {confirmSendInvitation.user.email}?
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                onClick={() => setConfirmSendInvitation({ open: false, user: null })}
                disabled={isSendingInvitation}
              >
                Cancel
              </button>
              <button
                className="bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                onClick={handleSendInvitation}
                disabled={isSendingInvitation}
              >
                {isSendingInvitation ? (
                  <>
                    <svg 
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24"
                    >
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                      ></circle>
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending...
                  </>
                ) : "Send Invitation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {isStatusModalOpen && selectedUserForStatus && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-semibold mb-4">Update User Status</h3>
            <div className="mb-4">
              <p className="text-sm mb-2">
                Updating status for: <strong>{selectedUserForStatus.username}</strong>
              </p>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Select Status
              </label>
              <select
                id="status"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-emerald-500 transition duration-200"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="REVOKED">REVOKED</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                onClick={closeStatusModal}
              >
                Cancel
              </button>
              <button
                className="bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                onClick={handleStatusUpdate}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifierUser;