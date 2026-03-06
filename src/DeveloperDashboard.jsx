import React, { useEffect, useState, useMemo } from "react";
import Domo from "ryuu.js";
import { startDeveloperWorkflow } from "./api/developerWorkflow";
import gwcLogo from "./assert/gwc-logo.png";
import domoLogo from "./assert/domopalooza-logo.svg";
import toast, { Toaster } from "react-hot-toast";

function DeveloperDashboard() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [solutionLink, setSolutionLink] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  const [selectedDetailsTicket, setSelectedDetailsTicket] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  useEffect(() => {
    fetchOpenTickets();
  }, []);

  const fetchOpenTickets = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const res = await Domo.get(
        "/domo/datastores/v1/collections/support_requests/documents",
      );
      setTickets(res);
      setCurrentPage(1); // Reset to first page on new data
      toast.success("Tickets refreshed!");
    } catch (error) {
      console.error("Fetch tickets error:", error);
      toast.error("Failed to fetch tickets");
    } finally {
      setRefreshing(false);
    }
  };

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
    if (!link.trim()) {
      return "Solution link is required";
    }

    // Basic URL validation
    const urlPattern =
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
    if (!urlPattern.test(link)) {
      return "Please enter a valid URL (e.g., https://example.com/solution)";
    }

    return "";
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
    setShowPopup(true);
  };

  const openDetailsPopup = (ticket) => {
    setSelectedDetailsTicket(ticket);
    setShowDetailsPopup(true);
  };

  const submitSolution = async () => {
    const error = validateSolutionLink(solutionLink);
    setLinkError(error);

    if (error) return;

    setLoading(true);

    try {
      // Update ticket status and add solution link
      await Domo.put(
        `/domo/datastores/v1/collections/support_requests/documents/${selectedTicket.id}`,
        {
          content: {
            ...selectedTicket.content,
            status: "CLOSED",
            solutionLink: solutionLink,
            closedAt: new Date().toISOString()
          },
        },
      );

      // Start workflow with all required parameters
      await startDeveloperWorkflow({
        ticketId: selectedTicket.id,
        name: selectedTicket.content.customerName,
        email: selectedTicket.content.email,
        devEmail: "hariharan.pappannan@gwcdata.ai",
        usecase: selectedTicket.content.usecase,
        agentResult: selectedTicket.content.agentResult.join("\n"),
        solutionLink: solutionLink,
      });

      setSolutionLink("");
      setLinkError("");
      setShowPopup(false);

      // Refresh tickets
      await fetchOpenTickets();

      toast.success(
        "Solution submitted successfully! Email notification sent.",
      );
    } catch (error) {
      console.error("Submit error:", error);
      setLinkError("Failed to submit solution. Please try again.");
      toast.error("Failed to submit solution");
    } finally {
      setLoading(false);
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
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              {/* Left Logo - GWC */}
              <div className="flex items-center space-x-3">
                <img
                  src={gwcLogo}
                  alt="GWC"
                  className="h-8 sm:h-10 w-auto object-contain"
                />
                <div className="h-6 sm:h-8 w-px bg-[#1E3A8A]/30"></div>
                <div>
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
                  className="h-6 sm:h-8 w-auto object-contain"
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
                      <tr key={ticket.id} className="border-b border-gray-100">
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
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
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <span className="text-xs sm:text-sm text-gray-600 break-all">
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
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <span
                            className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(ticket.content.status)}`}>
                            <span
                              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                ticket.content.status === "OPEN"
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
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <button
                            onClick={() => openPopup(ticket)}
                            disabled={ticket.content.status === "CLOSED"}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-all ${
                              ticket.content.status === "CLOSED"
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
            <div className="bg-white rounded-2xl max-w-md w-full mx-auto shadow-2xl transform animate-slideUp border border-gray-100">
              {/* Modal Header */}
              <div className="relative">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FBBF24] via-[#F97316] to-[#1E3A8A] rounded-t-2xl"></div>
                <div className="p-4 sm:p-6 pb-3 sm:pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#1E3A8A] to-[#0A1E3C] rounded-lg flex items-center justify-center shadow-lg">
                        <span className="text-white text-base sm:text-lg">
                          ✓
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-[#0A1E3C]">
                          Submit Solution
                        </h3>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPopup(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors w-6 h-6 sm:w-7 sm:h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-base sm:text-lg">
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
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
                    Solution Link <span className="text-[#FBBF24]">*</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://docs.example.com/solution"
                    value={solutionLink}
                    onChange={handleSolutionLinkChange}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 ${
                      linkError
                        ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
                        : solutionLink && !linkError
                          ? "border-green-300 bg-green-50 focus:border-green-400 focus:ring-green-200"
                          : "border-gray-200 focus:border-[#1E3A8A] focus:ring-[#1E3A8A]/20"
                    }`}
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

                {/* Action Buttons */}
                <div className="flex space-x-2 sm:space-x-3">
                  <button
                    onClick={() => setShowPopup(false)}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-xs sm:text-sm font-medium transition-all">
                    Cancel
                  </button>
                  <button
                    onClick={submitSolution}
                    disabled={loading || !!linkError}
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
                        <span>Submitting...</span>
                      </>
                    ) : (
                      "Submit Solution"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Read More Details Popup */}
        {showDetailsPopup && selectedDetailsTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full mx-auto shadow-2xl transform animate-slideUp border border-gray-100 my-8">
              {/* Modal Header - Sticky */}
              <div className="sticky top-0 bg-white rounded-t-2xl z-10">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FBBF24] via-[#F97316] to-[#1E3A8A] rounded-t-2xl"></div>
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
                      className="text-gray-400 hover:text-gray-600 transition-colors w-6 h-6 sm:w-7 sm:h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-base sm:text-lg">
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
                              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                selectedDetailsTicket.content.status === "OPEN"
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

                    {/* AI Agent Result Section */}
                    {selectedDetailsTicket.content.agentResult && (
                      <div className="border-t border-gray-200 pt-3 sm:pt-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                          <span className="w-1 h-4 bg-[#FBBF24] rounded-full mr-2"></span>
                          AI Agent Analysis
                        </h4>
                        <div className="bg-gradient-to-br from-[#1E3A8A]/5 to-[#0A1E3C]/5 rounded-lg p-4 border border-[#FBBF24]/20">
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-[#1E3A8A] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-white text-xs">🤖</span>
                            </div>
                            <div className="flex-1">
                              {Array.isArray(
                                selectedDetailsTicket.content.agentResult,
                              ) ? (
                                <ul className="list-disc pl-4 space-y-2">
                                  {selectedDetailsTicket.content.agentResult.map(
                                    (step, index) => (
                                      <li
                                        key={index}
                                        className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words">
                                        {step}
                                      </li>
                                    ),
                                  )}
                                </ul>
                              ) : (
                                <p className="text-xs sm:text-sm text-gray-700 break-words">
                                  {selectedDetailsTicket.content.agentResult}
                                </p>
                              )}
                            </div>
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
      </div>
    </>
  );
}

export default DeveloperDashboard;
