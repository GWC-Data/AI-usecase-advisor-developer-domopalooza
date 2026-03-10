import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import gwcLogo from "./assert/gwc-logo.png";
import domoLogo from "./assert/domopalooza-logo.svg";
import toast, { Toaster } from "react-hot-toast";
import { useDropzone } from "react-dropzone";
import {
  submitDeveloperSolution,
  getTickets,
  getDevelopers,
  addDeveloper,
  deleteDeveloper,
  toggleDeveloperSelected,
  uploadImage,
  deleteImageFromCloudinary,
} from "./api/developerWorkflow";

// Celebration Blast Component - Copied from your working App
const CelebrationBlast = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Create 200 small particles for dense burst effect
    const newParticles = Array.from({ length: 200 }, (_, i) => {
      // Determine if particle comes from bottom left or bottom right corner
      const side = Math.random() > 0.5 ? "left" : "right";

      // Small size range (3-12px)
      const size = Math.random() * 9 + 3; // 3-12px

      // Random direction
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 150 + 50; // 50-200px

      // Calculate translation
      const tx = Math.cos(angle) * distance;
      const ty = -Math.abs(Math.sin(angle) * distance) - 20; // Always go upward

      return {
        id: i,
        side,
        // Position at bottom corners
        left: side === "left" ? 0 : "100%",
        bottom: 0,
        size: `${size}px`,
        color: [
          "#FBBF24",
          "#F97316",
          "#1E3A8A",
          "#3B82F6",
          "#10B981",
          "#EC4899",
          "#8B5CF6",
          "#EF4444",
          "#F59E0B",
          "#6366F1",
          "#06B6D4",
          "#84CC16",
          "#D946EF",
          "#F43F5E",
          "#14B8A6",
          "#A855F7",
          "#F472B6",
          "#60A5FA",
          "#FBBF24",
          "#F97316",
          "#1E3A8A",
          "#3B82F6",
        ][Math.floor(Math.random() * 22)],
        animationDuration: `${Math.random() * 1.5 + 0.8}s`, // 0.8-2.3 seconds
        animationDelay: `${Math.random() * 0.2}s`,
        rotation: Math.random() * 720,
        tx: tx,
        ty: ty,
        shape: Math.random() > 0.5 ? "circle" : "square",
        opacity: Math.random() * 0.4 + 0.6,
      };
    });

    setParticles(newParticles);

    // Remove particles after animation
    const timer = setTimeout(() => {
      setParticles([]);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ zIndex: 9999 }}>
      <style>
        {`
          @keyframes blastAnimation {
            0% {
              transform: scale(0) rotate(0deg) translate(0, 0);
              opacity: 1;
            }
            20% {
              transform: scale(1.3) rotate(180deg) translate(var(--tx, 50px), var(--ty, -50px));
              opacity: 1;
            }
            40% {
              transform: scale(1.1) rotate(270deg) translate(calc(var(--tx, 50px) * 1.5), calc(var(--ty, -50px) * 1.3));
              opacity: 0.9;
            }
            60% {
              transform: scale(0.9) rotate(360deg) translate(calc(var(--tx, 50px) * 1.8), calc(var(--ty, -50px) * 1.6));
              opacity: 0.7;
            }
            80% {
              transform: scale(0.6) rotate(450deg) translate(calc(var(--tx, 50px) * 2), calc(var(--ty, -50px) * 1.9));
              opacity: 0.4;
            }
            100% {
              transform: scale(0) rotate(540deg) translate(calc(var(--tx, 50px) * 2.2), calc(var(--ty, -50px) * 2.2));
              opacity: 0;
            }
          }
        `}
      </style>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: particle.left,
            bottom: particle.bottom,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            animation: `blastAnimation ${particle.animationDuration} cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            animationDelay: particle.animationDelay,
            borderRadius: particle.shape === "circle" ? "50%" : "2px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            border: "none",
            opacity: particle.opacity,
            "--tx": particle.tx + "px",
            "--ty": particle.ty + "px",
            willChange: "transform, opacity",
            transform: "translateZ(0)", // Force hardware acceleration
          }}
        />
      ))}
    </div>
  );
};

function DeveloperDashboard() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [solutionLink, setSolutionLink] = useState("");
  const [comments, setComments] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [commentsError, setCommentsError] = useState("");
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  const [selectedDetailsTicket, setSelectedDetailsTicket] = useState(null);

  // State for success popup - exactly like your App
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successEmail, setSuccessEmail] = useState("");
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const [result, setResult] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(5);

  // Developer email state
  const [showDevEmailPopup, setShowDevEmailPopup] = useState(false);
  const [developers, setDevelopers] = useState([]);
  const [devLoading, setDevLoading] = useState(false);
  const [showAddDevForm, setShowAddDevForm] = useState(false);
  const [newDevEmail, setNewDevEmail] = useState("");
  const [newDevEmailError, setNewDevEmailError] = useState("");
  const [addingDev, setAddingDev] = useState(false);
  const [selectedDevEmails, setSelectedDevEmails] = useState([]);
  const [solutionImageUrl, setSolutionImageUrl] = useState("");
  const [solutionImagePublicId, setSolutionImagePublicId] = useState("");
  const [imageUrlError, setImageUrlError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Dropzone setup
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Optional: basic size/type validation
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Max 5MB.");
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      // API call to backend's /upload endpoint using our helper function
      const response = await uploadImage(formData);

      if (response?.url) {
        setSolutionImageUrl(response.url);
        setSolutionImagePublicId(response.public_id);
        setImageUrlError("");
        toast.success("Image uploaded successfully!");
      }
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    multiple: false,
  });

  const handleRemoveImage = async () => {
    if (!solutionImagePublicId) {
      setSolutionImageUrl("");
      return;
    }

    setUploadingImage(true);
    try {
      await deleteImageFromCloudinary(solutionImagePublicId);
      setSolutionImageUrl("");
      setSolutionImagePublicId("");
      toast.success("Image removed from Cloudinary");
    } catch (err) {
      console.error("Failed to delete image", err);
      toast.error("Failed to remove image from cloud");
    } finally {
      setUploadingImage(false);
    }
  };

  const refreshingRef = useRef(false);

  const fetchOpenTickets = useCallback(async () => {
    if (refreshingRef.current) return;

    refreshingRef.current = true;
    setRefreshing(true);

    try {
      const res = await getTickets();

      setTickets(res);
      setCurrentPage(1);

      toast.success("Tickets refreshed!");
    } catch (error) {
      console.error("Fetch tickets error:", error);
      toast.error("Failed to fetch tickets");
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOpenTickets();
  }, [fetchOpenTickets]);

  const filteredTickets = useMemo(() => {
    let filtered = [...tickets];

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (ticket) => ticket.content.status === statusFilter,
      );
    }

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();

      filtered = filtered.filter((ticket) => {
        const name = ticket.content.customerName?.toLowerCase() || "";
        const email = ticket.content.email?.toLowerCase() || "";
        const usecase = ticket.content.usecase?.toLowerCase() || "";

        return (
          name.includes(term) || email.includes(term) || usecase.includes(term)
        );
      });
    }

    return filtered;
  }, [tickets, searchTerm, statusFilter]);

  // Pagination logic
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredTickets.slice(startIndex, endIndex);
  }, [filteredTickets, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredTickets.length / rowsPerPage);

  const validateSolutionLink = (link) => {
    if (!link || link.trim() === "") {
      return "";
    }
    // Basic URL validation
    const urlPattern =
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
    if (!urlPattern.test(link)) {
      return "Please enter a valid URL (e.g., https://example.com/solution)";
    }

    return "";
  };

  const validateImageUrl = (url) => {
    if (!url.trim()) return "";
    const urlPattern =
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
    if (!urlPattern.test(url)) return "Please enter a valid image URL";
    return "";
  };

  const handleImageUrlChange = (e) => {
    const val = e.target.value;
    setSolutionImageUrl(val);
    setImageUrlError(validateImageUrl(val));
  };

  const validateComments = (value) => {
    if (!value.trim()) return "Comments are required";
    if (value.trim().length < 10)
      return "Please provide more detail (min 10 characters)";
    return "";
  };

  const handleCommentsChange = (e) => {
    const value = e.target.value;
    setComments(value);
    setCommentsError(validateComments(value));
  };

  const handleSolutionLinkChange = (e) => {
    const link = e.target.value;
    setSolutionLink(link);
    setLinkError(validateSolutionLink(link));
  };

  const openPopup = (ticket) => {
    setSelectedTicket(ticket);
    setSolutionLink("");
    setLinkError("");
    setComments("");
    setCommentsError("");
    setShowPopup(true);
    setSolutionImageUrl("");
    setImageUrlError("");
  };

  const openDetailsPopup = (ticket) => {
    setSelectedDetailsTicket(ticket);
    setShowDetailsPopup(true);
  };

  const fetchDevelopers = async () => {
    setDevLoading(true);
    try {
      const res = await getDevelopers();
      setDevelopers(res);
      // Restore selected state from AppDB
      const alreadySelected = res
        .filter((d) => d.content?.isSelected === true)
        .map((d) => d.content.email);
      setSelectedDevEmails(alreadySelected);
    } catch (err) {
      toast.error("Failed to load developers");
    } finally {
      setDevLoading(false);
    }
  };

  const handleOpenDevEmailPopup = () => {
    fetchDevelopers();
    setShowDevEmailPopup(true);
    setShowAddDevForm(false);
    setNewDevEmail("");
    setNewDevEmailError("");
  };

  const toggleDevEmail = async (dev) => {
    const newSelected = !dev.content.isSelected;

    // Optimistic UI update
    setDevelopers((prev) =>
      prev.map((d) =>
        d.id === dev.id
          ? { ...d, content: { ...d.content, isSelected: newSelected } }
          : d,
      ),
    );
    setSelectedDevEmails((prev) =>
      newSelected
        ? [...prev, dev.content.email]
        : prev.filter((e) => e !== dev.content.email),
    );

    try {
      await toggleDeveloperSelected(dev.id, {
        email: dev.content.email,
        isSelected: newSelected,
      });
    } catch {
      toast.error("Failed to update selection");
      // Revert on failure
      fetchDevelopers();
    }
  };

  const handleClearAll = async () => {
    // Optimistic update
    setSelectedDevEmails([]);
    setDevelopers((prev) =>
      prev.map((d) => ({ ...d, content: { ...d.content, isSelected: false } })),
    );

    // Persist each deselection
    try {
      await Promise.all(
        developers
          .filter((d) => d.content?.isSelected)
          .map((d) =>
            toggleDeveloperSelected(d.id, {
              email: d.content.email,
              isSelected: false,
            }),
          ),
      );
    } catch {
      toast.error("Failed to clear selection");
      fetchDevelopers();
    }
  };

  const handleAddDeveloper = async () => {
    if (!newDevEmail.trim()) {
      setNewDevEmailError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newDevEmail)) {
      setNewDevEmailError("Enter a valid email");
      return;
    }
    setNewDevEmailError("");

    setAddingDev(true);
    try {
      await addDeveloper({
        email: newDevEmail.trim(),
      });
      toast.success("Developer added!");
      setNewDevEmail("");
      setShowAddDevForm(false);
      fetchDevelopers();
    } catch {
      toast.error("Failed to add developer");
    } finally {
      setAddingDev(false);
    }
  };

  const handleDeleteDeveloper = async (id, email) => {
    try {
      await deleteDeveloper(id);
      setDevelopers((prev) => prev.filter((d) => d.id !== id));
      setSelectedDevEmails((prev) => prev.filter((e) => e !== email));
      toast.success("Developer removed");
    } catch {
      toast.error("Failed to remove developer");
    }
  };

  const submitSolution = async () => {
    const cError = validateComments(comments);
    setCommentsError(cError);

    if (cError) return;

    setLoading(true);
    setWorkflowStatus("IN_PROGRESS");

    try {
      const res = await submitDeveloperSolution({
        ticketId: selectedTicket.id,
        name: selectedTicket.content.customerName,
        email: selectedTicket.content.email,
        usecase: selectedTicket.content.usecase,
        agentResult: selectedTicket.content.agentResult.join("\n"),
        solutionLink: solutionLink,
        solutionImageUrl: solutionImageUrl,
        comments: comments,
        existingContent: selectedTicket.content,
      });

      if (res.status === "COMPLETED") {
        setWorkflowStatus("COMPLETED");

        setResult({
          name: selectedTicket.content.customerName,
          email: selectedTicket.content.email,
          usecase: selectedTicket.content.usecase,
          status: "COMPLETED",
          message:
            "Your solution has been submitted and an email has been sent to the customer.",
        });

        setSuccessEmail(selectedTicket.content.email);

        setShowPopup(false);
        setShowSuccessPopup(true);

        await fetchOpenTickets();
      }
    } catch (err) {
      console.error(err);

      setWorkflowStatus("FAILED");
      setLinkError("Failed to submit solution. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccessPopup = () => {
    setShowSuccessPopup(false);
    setWorkflowStatus(null);
    setResult(null);
  };

  const handleCancelPopup = () => {
    // Only allow cancel if not loading
    if (!loading) {
      setShowPopup(false);
      setSolutionLink("");
      setLinkError("");
      setComments("");
      setCommentsError("");
      setWorkflowStatus(null);
      setSolutionImageUrl("");
      setImageUrlError("");
    }
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case "OPEN":
        return "bg-[#FBBF24]/20 text-[#0A1E3C] border border-[#FBBF24]/30";
      case "CLOSED":
        return "bg-green-100 text-green-800 border border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-[#F8FAFC]">
        {/* Header with Logos - Responsive */}
        <div className="bg-white border-b border-[#1E3A8A]/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-row justify-between items-center gap-3">
              {/* Left Logo - GWC */}
              <div className="flex items-center space-x-3">
                <img
                  src={gwcLogo}
                  alt="GWC"
                  className="w-[150px] md:w-[200px] object-contain"
                />
                <div className="h-6 sm:h-8 w-px bg-[#1E3A8A]/30 hidden md:block"></div>
                <div className="hidden md:block">
                  <span className="text-xs sm:text-sm font-semibold text-[#1E3A8A]">
                    DEVELOPER
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-400 ml-1 sm:ml-2">
                    DASHBOARD
                  </span>
                </div>
              </div>

              {/* Right Logo - DomoPalooza */}
              <div className="flex items-center justify-between sm:justify-end space-x-3">
                <img
                  src={domoLogo}
                  alt="DomoPalooza"
                  className="w-[150px] md:w-[200px] object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Page Title */}
          <div className="mb-6 sm:mb-8">
            <div className="w-12 sm:w-16 h-1 bg-[#FBBF24] rounded-full mb-3 sm:mb-4"></div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0A1E3C]">
                Support Tickets
              </h1>
              {/* Tickets count moved here */}
              <div className="bg-[#FBBF24]/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full inline-flex items-center self-start sm:self-auto">
                <span className="text-xs sm:text-sm font-semibold text-[#1E3A8A]">
                  Total Tickets: {filteredTickets.length}
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              Manage and resolve customer requests
            </p>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-xl shadow-sm border border-[#1E3A8A]/10 p-4 sm:p-5 mb-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base">
                    🔍
                  </span>
                  <input
                    type="text"
                    placeholder="Search by name, email, or use case..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]/20"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-40">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]/20">
                  <option value="all">All Status</option>
                  <option value="OPEN">OPEN</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              {/* Developer Email Button */}
              <button
                onClick={handleOpenDevEmailPopup}
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-[#1E3A8A] hover:bg-[#0A1E3C] text-white rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center space-x-2 relative">
                <span>👨‍💻</span>
                <span>Dev Email</span>
                {selectedDevEmails.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#FBBF24] text-[#0A1E3C] rounded-full text-[10px] font-bold flex items-center justify-center">
                    {selectedDevEmails.length}
                  </span>
                )}
              </button>

              {/* Refresh Button */}
              <button
                onClick={fetchOpenTickets}
                disabled={refreshing}
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-[#1E3A8A]/10 hover:bg-[#1E3A8A]/20 text-[#1E3A8A] rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <span className={`${refreshing ? "animate-spin" : ""} text-sm`}>
                  🔄
                </span>
                <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
              </button>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="bg-white rounded-xl shadow-lg border border-[#1E3A8A]/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-[#1E3A8A]/5 to-[#0A1E3C]/5 border-b border-[#1E3A8A]/20">
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-[#0A1E3C] uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-[#0A1E3C] uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-[#0A1E3C] uppercase tracking-wider">
                      Use Case
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-[#0A1E3C] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-[#0A1E3C] uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {paginatedTickets.length > 0 ? (
                    paginatedTickets.map((ticket, index) => (
                      <tr
                        key={ticket.id}
                        className="border-b border-gray-100 hover:bg-[#F8FAFF] transition-colors">
                        <td className="px-4 sm:px-6 py-3 sm: text-nowrap">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-[#1E3A8A] to-[#0A1E3C] rounded-lg flex items-center justify-center text-white text-xs sm:text-sm font-medium">
                              {ticket.content.customerName
                                ?.charAt(0)
                                ?.toUpperCase() || "?"}
                            </div>
                            <span className="text-xs sm:text-sm font-medium text-gray-900">
                              {ticket.content.customerName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className="text-xs sm:text-sm text-gray-600">
                            {ticket.content.email}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="max-w-xs relative">
                            <div className="text-xs sm:text-sm text-gray-600 line-clamp-2 pr-10">
                              {ticket.content.usecase}
                            </div>
                            <button
                              onClick={() => openDetailsPopup(ticket)}
                              className="absolute bottom-0 right-0 text-[#1E3A8A] hover:text-[#0A1E3C] font-medium text-xs hover:underline focus:outline-none bg-white pl-1">
                              Read more
                            </button>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-nowrap">
                          <span
                            className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(ticket.content.status)}`}>
                            <span
                              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${ticket.content.status === "OPEN"
                                ? "bg-[#FBBF24] animate-pulse"
                                : ticket.content.status === "CLOSED"
                                  ? "bg-green-500"
                                  : "bg-gray-400"
                                }`}></span>
                            <span className="text-[10px] sm:text-xs">
                              {ticket.content.status || "OPEN"}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-nowrap">
                          <button
                            onClick={() => openPopup(ticket)}
                            disabled={ticket.content.status === "CLOSED"}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-all ${ticket.content.status === "CLOSED"
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-gradient-to-r from-[#1E3A8A] to-[#0A1E3C] text-white shadow-md hover:shadow-lg"
                              }`}>
                            {ticket.content.status === "CLOSED"
                              ? "Resolved"
                              : "Approve & Solve"}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-3xl sm:text-4xl mb-2 sm:mb-3">
                            📭
                          </span>
                          <p className="text-sm sm:text-base text-gray-500">
                            No tickets found
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Try adjusting your search or filters
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredTickets.length > 0 && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <span className="text-xs text-gray-500 order-2 sm:order-1">
                    Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
                    {Math.min(
                      currentPage * rowsPerPage,
                      filteredTickets.length,
                    )}{" "}
                    of {filteredTickets.length} tickets
                  </span>
                  <div className="flex items-center justify-center sm:justify-end space-x-2 order-1 sm:order-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      Previous
                    </button>
                    <span className="text-xs text-gray-600 px-2">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Solution Popup Modal */}
        {showPopup && selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md sm:max-w-lg md:max-w-3xl w-full mx-auto shadow-2xl transform animate-slideUp border border-gray-100 flex flex-col max-h-[85vh]">
              {/* Modal Header */}
              <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#1E3A8A] to-[#0A1E3C] rounded-lg flex items-center justify-center shadow-lg">
                      <span className="text-white text-base sm:text-lg">✓</span>
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#0A1E3C]">
                        Submit Solution
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={handleCancelPopup}
                    className="text-gray-400 hover:text-gray-600 transition-colors w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-base disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={loading}>
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 overflow-y-auto flex-1">
                {/* Ticket Summary */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 border border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Ticket Details
                  </h4>
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start">
                      <span className="w-full sm:w-16 text-gray-500 mb-1 sm:mb-0">
                        Name:
                      </span>
                      <span className="text-gray-900 font-medium break-all">
                        {selectedTicket.content.customerName}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-start">
                      <span className="w-full sm:w-16 text-gray-500 mb-1 sm:mb-0">
                        Email:
                      </span>
                      <span className="text-gray-900 break-all">
                        {selectedTicket.content.email}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-start">
                      <span className="w-full sm:w-16 text-gray-500 mb-1 sm:mb-0">
                        Use Case:
                      </span>
                      <span className="text-gray-900 flex-1">
                        {selectedTicket.content.usecase}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Solution Link Input with Validation */}
                <div className="mb-4 sm:mb-5">
                  <label className="block text-xs sm:text-sm font-medium text-[#0A1E3C] mb-1.5 sm:mb-2">
                    Solution Link{" "}
                    <span className="text-gray-400 font-normal text-[10px]">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://docs.example.com/solution"
                    value={solutionLink}
                    onChange={handleSolutionLinkChange}
                    disabled={loading}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 ${linkError
                      ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
                      : solutionLink && !linkError
                        ? "border-green-300 bg-green-50 focus:border-green-400 focus:ring-green-200"
                        : "border-gray-200 focus:border-[#1E3A8A] focus:ring-[#1E3A8A]/20"
                      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                  {/* Validation Error Message */}
                  {linkError && (
                    <div className="flex items-center mt-1.5 sm:mt-2 text-xs text-red-600">
                      <span className="mr-1">⚠️</span>
                      <span>{linkError}</span>
                    </div>
                  )}
                  {/* Success Message */}
                  {solutionLink && !linkError && (
                    <div className="flex items-center mt-1.5 sm:mt-2 text-xs text-green-600">
                      <span className="mr-1">✓</span>
                      <span>Valid URL format</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5 sm:mt-2">
                    Paste a link to documentation, code repository, or solution
                    guide
                  </p>
                </div>

                {/* Solution Image Upload using React Dropzone */}
                <div className="mb-4 sm:mb-5">
                  <label className="block text-xs sm:text-sm font-medium text-[#0A1E3C] mb-1.5 sm:mb-2 flex justify-between items-center">
                    <span>Solution Screenshot (Dropzone)</span>
                    {solutionImageUrl && (
                      <button
                        onClick={handleRemoveImage}
                        disabled={uploadingImage}
                        className="text-red-500 hover:text-red-700 text-[10px] font-medium transition-colors disabled:opacity-50"
                      >
                        {uploadingImage ? "Removing..." : "Remove Image"}
                      </button>
                    )}
                  </label>

                  {!solutionImageUrl ? (
                    <div
                      {...getRootProps()}
                      className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-300 ${isDragActive
                        ? "border-[#1E3A8A] bg-[#1E3A8A]/10 scale-[1.01]"
                        : "border-gray-300 hover:border-[#1E3A8A]/50 hover:bg-gray-50 bg-white"
                        } ${uploadingImage ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <input {...getInputProps()} disabled={uploadingImage} />

                      {uploadingImage ? (
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <svg className="animate-spin h-8 w-8 text-[#1E3A8A]" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <p className="text-sm font-semibold text-[#1E3A8A]">Uploading to Cloudinary...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-12 h-12 bg-[#1E3A8A]/5 rounded-full flex items-center justify-center mb-1">
                            <span className="text-2xl">📸</span>
                          </div>
                          <p className="text-sm font-semibold text-[#1E3A8A]">
                            {isDragActive ? "Drop the screenshot here" : "Click or drag screenshot here"}
                          </p>
                          <p className="text-xs text-gray-400">PNG, JPG or JPEG (Max 5MB)</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-lg bg-gray-50 h-[180px] sm:h-[220px]">
                      <img
                        src={solutionImageUrl}
                        alt="Solution Screenshot"
                        className="w-full h-full object-contain pointer-events-none transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                          Image uploaded Successfully
                        </span>
                      </div>
                      <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Manual fallback input (hidden or just for URL showing) */}
                    {/*
                  <div className="mt-3">
                    <div className="relative">
                      <input
                        type="url"
                        placeholder="Or paste an image URL..."
                        value={solutionImageUrl}
                        onChange={handleImageUrlChange}
                        disabled={loading || uploadingImage}
                        className={`w-full px-3 sm:px-4 py-2 border rounded-lg text-[10px] sm:text-xs transition-all focus:outline-none focus:ring-2 ${imageUrlError
                          ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
                          : solutionImageUrl && !imageUrlError
                            ? "border-green-300 bg-green-50 focus:border-green-400 focus:ring-green-200"
                            : "border-gray-200 focus:border-[#1E3A8A] focus:ring-[#1E3A8A]/20"
                          } ${loading || uploadingImage ? "opacity-50 cursor-not-allowed" : ""}`}
                      />
                    </div>
                    
                    <p className="text-[10px] text-gray-400 mt-1.5 flex items-center">
                      <span className="mr-1">ℹ️</span>
                      Cloudinary URL will be automatically populated after upload.
                    </p>
                  </div>
                    */}
                </div>

                {/* Comments Field */}
                <div className="mb-4 sm:mb-5">
                  <label className="block text-xs sm:text-sm font-medium text-[#0A1E3C] mb-1.5 sm:mb-2">
                    Comments <span className="text-[#FBBF24]">*</span>
                  </label>
                  <textarea
                    placeholder="Add any additional notes or context for the customer..."
                    value={comments}
                    onChange={handleCommentsChange}
                    disabled={loading}
                    rows={3}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 resize-none ${commentsError
                      ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
                      : comments && !commentsError
                        ? "border-green-300 bg-green-50 focus:border-green-400 focus:ring-green-200"
                        : "border-gray-200 focus:border-[#1E3A8A] focus:ring-[#1E3A8A]/20"
                      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                  {/* Error Message */}
                  {commentsError && (
                    <div className="flex items-center mt-1.5 sm:mt-2 text-xs text-red-600">
                      <span className="mr-1">⚠️</span>
                      <span>{commentsError}</span>
                    </div>
                  )}
                  {/* Success Message */}
                  {comments && !commentsError && (
                    <div className="flex items-center mt-1.5 sm:mt-2 text-xs text-green-600"></div>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5 sm:mt-2">
                    Any extra context or notes to include in the email to the
                    customer.
                  </p>
                </div>

                {/* Action Buttons */}
                <div>
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100 pt-3 bg-white rounded-b-2xl">
                    <div className="flex space-x-2 sm:space-x-3">
                      <button
                        onClick={handleCancelPopup}
                        disabled={loading}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-xs sm:text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                        Cancel
                      </button>
                      <button
                        onClick={submitSolution}
                        disabled={loading || !!linkError || !!imageUrlError || commentsError}
                        className="flex-1 bg-gradient-to-r from-[#1E3A8A] to-[#0A1E3C] hover:from-[#0A1E3C] hover:to-[#1E3A8A] text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-lg text-xs sm:text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center">
                        {loading ? (
                          <>
                            <svg
                              className="animate-spin h-3 w-3 sm:h-4 sm:w-4 text-white mr-1 sm:mr-2"
                              viewBox="0 0 24 24">
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            <span>Processing...</span>
                          </>
                        ) : (
                          "Submit Solution"
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status message while workflow is in progress */}
                {loading && workflowStatus === "IN_PROGRESS" && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700 flex items-center">
                      <span className="mr-2">⏳</span>
                      Workflow in progress. Please wait...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Read More Details Popup */}
        {showDetailsPopup && selectedDetailsTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-md sm:max-w-lg md:max-w-3xl w-full mx-auto shadow-2xl transform animate-slideUp border border-gray-100 flex flex-col max-h-[85vh]">
              {/* Modal Header - Sticky */}
              <div className="sticky top-0 bg-white rounded-t-2xl z-10">
                {/* <div className="h-1.5 bg-gradient-to-r from-[#FBBF24] via-[#F97316] to-[#1E3A8A] rounded-t-2xl"></div> */}
                <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#1E3A8A] to-[#0A1E3C] rounded-lg flex items-center justify-center shadow-lg">
                        <span className="text-white text-base sm:text-lg">
                          📋
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-[#0A1E3C]">
                          Ticket Details
                        </h3>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDetailsPopup(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-base">
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="px-4 sm:px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Full Ticket Details */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 sm:p-5 border border-gray-200">
                  <div className="space-y-3 sm:space-y-4">
                    {/* Customer Information */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Customer Information
                      </h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex flex-col sm:flex-row sm:items-start">
                          <span className="w-full sm:w-20 text-gray-500 mb-1 sm:mb-0">
                            Name:
                          </span>
                          <span className="text-gray-900 font-medium break-words">
                            {selectedDetailsTicket.content.customerName}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-start">
                          <span className="w-full sm:w-20 text-gray-500 mb-1 sm:mb-0">
                            Email:
                          </span>
                          <span className="text-gray-900 break-all break-words">
                            {selectedDetailsTicket.content.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Use Case Details */}
                    <div className="border-t border-gray-200 pt-3 sm:pt-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Use Case Details
                      </h4>
                      <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-100">
                        <p className="text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                          {selectedDetailsTicket.content.usecase}
                        </p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="border-t border-gray-200 pt-3 sm:pt-4">
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <span className="text-gray-500 block">Status:</span>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusBadge(selectedDetailsTicket.content.status)}`}>
                            <span
                              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${selectedDetailsTicket.content.status === "OPEN"
                                ? "bg-[#FBBF24] animate-pulse"
                                : selectedDetailsTicket.content.status ===
                                  "CLOSED"
                                  ? "bg-green-500"
                                  : "bg-gray-400"
                                }`}></span>
                            <span>
                              {selectedDetailsTicket.content.status || "OPEN"}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Solution Details (if closed) */}
                    {selectedDetailsTicket.content.status === "CLOSED" && (
                      <div className="border-t border-gray-200 pt-3 sm:pt-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Solution Details
                        </h4>
                        <div className="space-y-3">
                          {selectedDetailsTicket.content.solutionLink && (
                            <div>
                              <span className="text-gray-500 block text-xs">Solution Link:</span>
                              <a
                                href={selectedDetailsTicket.content.solutionLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#1E3A8A] hover:underline text-xs break-all"
                              >
                                {selectedDetailsTicket.content.solutionLink}
                              </a>
                            </div>
                          )}

                          {selectedDetailsTicket.content.solutionImageUrl && (
                            <div>
                              <span className="text-gray-500 block text-xs mb-2">Solution Screenshot:</span>
                              <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 max-h-[300px]">
                                <img
                                  src={selectedDetailsTicket.content.solutionImageUrl}
                                  alt="Solution Screenshot"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            </div>
                          )}

                          {selectedDetailsTicket.content.comments && (
                            <div>
                              <span className="text-gray-500 block text-xs">Developer Comments:</span>
                              <p className="text-xs text-gray-700 mt-1 italic">
                                "{selectedDetailsTicket.content.comments}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* AI Agent Result Section - Enhanced Version */}
                    {selectedDetailsTicket.content.agentResult && (
                      <div className="border-t border-gray-200 pt-3 sm:pt-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                          <span className="w-1 h-4 bg-[#FBBF24] rounded-full mr-2"></span>
                          AI Agent Analysis Results
                        </h4>

                        {/* Main Agent Result Card */}
                        <div className="bg-gradient-to-br from-[#1E3A8A]/5 to-[#0A1E3C]/5 rounded-xl p-4 border-2 border-[#FBBF24]/30 shadow-sm">
                          {/* Agent Header */}
                          <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-[#FBBF24]/20">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#1E3A8A] to-[#0A1E3C] rounded-xl flex items-center justify-center shadow-md">
                              <span className="text-white text-lg">🤖</span>
                            </div>
                            <div>
                              <h5 className="text-sm font-bold text-[#0A1E3C]">
                                AI Agent Analysis
                              </h5>
                            </div>
                            <div className="ml-auto">
                              <span className="bg-green-100 text-green-800 text-[10px] font-semibold px-2 py-1 rounded-full border border-green-200">
                                COMPLETED
                              </span>
                            </div>
                          </div>

                          {/* Analysis Content */}
                          <div className="space-y-4">
                            {Array.isArray(
                              selectedDetailsTicket.content.agentResult,
                            ) ? (
                              <>
                                {/* Recommendations List */}
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-[#1E3A8A] flex items-center">
                                    <span className="w-1 h-3 bg-[#FBBF24] rounded-full mr-2"></span>
                                    Recommended Actions
                                  </p>
                                  <ul className="space-y-2">
                                    {selectedDetailsTicket.content.agentResult.map(
                                      (step, index) => (
                                        <li
                                          key={index}
                                          className="flex items-start space-x-2 bg-white rounded-lg p-2 border border-gray-100 hover:border-[#FBBF24]/30 transition-colors">
                                          <span className="flex-shrink-0 w-5 h-5 bg-gradient-to-br from-[#1E3A8A] to-[#0A1E3C] rounded-full text-white text-[10px] flex items-center justify-center font-medium mt-0.5">
                                            {index + 1}
                                          </span>
                                          <span className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words flex-1">
                                            {step}
                                          </span>
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              </>
                            ) : typeof selectedDetailsTicket.content
                              .agentResult === "object" ? (
                              /* Object format */
                              <div className="space-y-3">
                                {Object.entries(
                                  selectedDetailsTicket.content.agentResult,
                                ).map(([key, value]) => (
                                  <div
                                    key={key}
                                    className="bg-white rounded-lg p-3 border border-gray-100">
                                    <span className="text-xs font-semibold text-[#1E3A8A] capitalize block mb-1">
                                      {key.replace(/_/g, " ")}:
                                    </span>
                                    <span className="text-xs text-gray-700">
                                      {typeof value === "object"
                                        ? JSON.stringify(value, null, 2)
                                        : value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              /* String format */
                              <div className="bg-white rounded-lg p-4 border border-gray-100">
                                <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                                  {selectedDetailsTicket.content.agentResult}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Close Button - Fixed at bottom */}
              <div className="sticky bottom-0 bg-white rounded-b-2xl p-4 sm:p-6 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setShowDetailsPopup(false)}
                  className="w-full px-4 py-2.5 sm:py-3 bg-gradient-to-r from-[#1E3A8A] to-[#0A1E3C] hover:from-[#0A1E3C] hover:to-[#1E3A8A] text-white font-semibold rounded-lg text-xs sm:text-sm transition-all shadow-md hover:shadow-lg">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Celebration Popup - Exactly like your App's pattern */}
        {showSuccessPopup && result && workflowStatus === "COMPLETED" && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full mx-auto shadow-2xl transform animate-slideUp border border-gray-100 relative overflow-hidden">
              {/* Bottom Corner Paper Burst - Only show for completed status */}
              {result.status === "COMPLETED" && <CelebrationBlast />}

              {/* Modal Header */}
              <div>
                <div className="h-1.5 bg-gradient-to-r from-green-400 to-green-600 rounded-t-2xl"></div>
                <div className="p-6 sm:p-8 text-center">
                  {/* Large Green Checkmark with Animation - Like your App */}
                  <div className="mb-6 relative">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden">
                      <span className="text-white text-4xl sm:text-5xl relative z-10">
                        ✓
                      </span>
                      {/* Ripple effect like your App */}
                      <div className="absolute inset-0 animate-ping bg-white opacity-30 rounded-full"></div>
                      <div className="absolute -inset-2 bg-green-300 opacity-20 blur-xl animate-pulse"></div>
                    </div>
                  </div>

                  {/* Success Message */}
                  <h3 className="text-xl sm:text-2xl font-bold text-[#0A1E3C] mb-3">
                    Email Sent Successfully!
                  </h3>

                  <p className="text-sm sm:text-base text-gray-600 mb-2">
                    Your solution has been submitted and an email has been sent
                    to:
                  </p>

                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 mb-4">
                    <p className="text-sm sm:text-base font-medium text-green-800 break-all">
                      {successEmail}
                    </p>
                  </div>

                  {/* Status Badge - CLOSED */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="bg-green-100 text-green-800 border border-green-200 inline-flex items-center px-4 py-2 rounded-full">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      <span className="text-sm font-semibold">
                        STATUS: CLOSED
                      </span>
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={handleCloseSuccessPopup}
                    className="w-full px-4 py-2.5 sm:py-3 bg-gradient-to-r from-[#1E3A8A] to-[#0A1E3C] hover:from-[#0A1E3C] hover:to-[#1E3A8A] text-white font-semibold rounded-lg text-xs sm:text-sm transition-all shadow-md hover:shadow-lg">
                    Great!
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Developer Email Popup */}
        {showDevEmailPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full mx-auto shadow-2xl border border-gray-100 flex flex-col max-h-[85vh]">
              {/* Header */}
              {/* <div className="h-1.5 bg-gradient-to-r from-[#FBBF24] via-[#F97316] to-[#1E3A8A] rounded-t-2xl"></div> */}
              <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#1E3A8A] to-[#0A1E3C] rounded-lg flex items-center justify-center shadow">
                    <span className="text-white text-base">👨‍💻</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0A1E3C]">
                      Developer Emails
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      Select who gets CC'd on resolution emails
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDevEmailPopup(false)}
                  className="text-gray-400 hover:text-gray-600 w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center">
                  ✕
                </button>
              </div>

              {/* Selected count badge */}
              {selectedDevEmails.length > 0 && (
                <div className="mx-4 mt-3 px-3 py-2 bg-[#1E3A8A]/5 border border-[#1E3A8A]/20 rounded-lg flex items-center justify-between">
                  <span className="text-xs text-[#1E3A8A] font-medium">
                    ✓ {selectedDevEmails.length} developer
                    {selectedDevEmails.length > 1 ? "s" : ""} selected for CC
                  </span>
                  <button
                    onClick={handleClearAll}
                    className="text-[10px] text-red-500 hover:text-red-700 font-medium">
                    Clear all
                  </button>
                </div>
              )}

              {/* Scrollable developer list */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {devLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <svg
                      className="animate-spin h-6 w-6 text-[#1E3A8A]"
                      viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  </div>
                ) : developers.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-3xl">👤</span>
                    <p className="text-sm text-gray-500 mt-2">
                      No developers yet
                    </p>
                    <p className="text-xs text-gray-400">Add one below</p>
                  </div>
                ) : (
                  developers.map((dev) => {
                    const isSelected = dev.content.isSelected === true;
                    return (
                      <div
                        key={dev.id}
                        onClick={() => toggleDevEmail(dev)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected
                          ? "border-[#1E3A8A] bg-[#1E3A8A]/5"
                          : "border-gray-200 hover:border-[#1E3A8A]/40 hover:bg-gray-50"
                          }`}>
                        <div className="flex items-center space-x-3">
                          {/* Checkbox */}
                          <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected
                              ? "bg-[#1E3A8A] border-[#1E3A8A]"
                              : "border-gray-300"
                              }`}>
                            {isSelected && (
                              <span className="text-white text-[10px] font-bold">
                                ✓
                              </span>
                            )}
                          </div>
                          {/* Email icon */}
                          <div className="w-8 h-8 bg-gradient-to-br from-[#1E3A8A] to-[#0A1E3C] rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs">📧</span>
                          </div>
                          <p className="text-sm text-gray-800 break-all">
                            {dev.content.email}
                          </p>
                        </div>
                        {/* Delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDeveloper(dev.id, dev.content.email);
                          }}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded ml-2 flex-shrink-0">
                          🗑️
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Developer Form */}
              {showAddDevForm && (
                <div className="mx-4 mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <p className="text-xs font-semibold text-[#0A1E3C] mb-2">
                    Add New Developer
                  </p>
                  <div>
                    <input
                      placeholder="Email Address *"
                      value={newDevEmail}
                      onChange={(e) => {
                        setNewDevEmail(e.target.value);
                        setNewDevEmailError("");
                      }}
                      className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] ${newDevEmailError
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200"
                        }`}
                    />
                    {newDevEmailError && (
                      <p className="text-[10px] text-red-500 mt-1">
                        ⚠️ {newDevEmailError}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2 pt-1">
                    <button
                      onClick={() => {
                        setShowAddDevForm(false);
                        setNewDevEmail("");
                        setNewDevEmailError("");
                      }}
                      className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100">
                      Cancel
                    </button>
                    <button
                      onClick={handleAddDeveloper}
                      disabled={addingDev}
                      className="flex-1 py-2 bg-gradient-to-r from-[#1E3A8A] to-[#0A1E3C] text-white rounded-lg text-xs font-medium disabled:opacity-50 flex items-center justify-center">
                      {addingDev ? (
                        <svg
                          className="animate-spin h-3 w-3"
                          viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      ) : (
                        <span>Save</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 flex space-x-2">
                <button
                  onClick={() => {
                    setShowAddDevForm((v) => !v);
                  }}
                  className="flex-1 py-2.5 border-2 border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A]/5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1">
                  <span>{showAddDevForm ? "✕ Cancel" : "+ Add Developer"}</span>
                </button>
                <button
                  onClick={() => setShowDevEmailPopup(false)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#1E3A8A] to-[#0A1E3C] text-white rounded-lg text-xs font-semibold shadow hover:shadow-md transition-all">
                  Done ({selectedDevEmails.length} selected)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

export default DeveloperDashboard;
