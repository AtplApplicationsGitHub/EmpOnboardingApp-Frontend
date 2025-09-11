"use client";

import Button from "@/app/components/Button";
import Input from "@/app/components/Input";
import { Card, CardContent } from "@/app/components/ui/card";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { labService } from "@/app/services/api";
import { DropDownDTO, Lab } from "@/app/types";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  Plus,
  Table,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const LabsPage: React.FC = () => {
  const locationInputRef = useRef<HTMLInputElement>(null);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationOptions, setLocationOptions] = useState<DropDownDTO[]>([]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFilter(searchInput);
    setCurrentPage(0);
  };

  const [formData, setFormData] = useState({
    location: "",
    labString: "",
  });
  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handlePageChange = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  const generatePageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage + 1 - delta);
      i <= Math.min(totalPages - 1, currentPage + 1 + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage + 1 - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + 1 + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const fetchLabs = async (page = currentPage, search = searchFilter) => {
    setLoading(true);
    setError(null);
    try {
      const result = await labService.getLabs(page, search || undefined);
      setLabs(result.commonListDto || []);
      setTotal(result.totalElements || 0);
    } catch (err: any) {
      console.error("Failed to fetch labs:", err);
      if (
        err.message?.includes("Network Error") ||
        err.message?.includes("CORS")
      ) {
        setError(
          "Unable to connect to server. Please check if the backend server is running and CORS is properly configured."
        );
      } else {
        setError("Failed to fetch labs. Please try again.");
      }
      setLabs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, [currentPage, searchFilter]);

  const handleUpdateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLabId) return;
    if (!formData.location.trim() || !formData.labString.trim()) {
      toast.error("Location and Labs are required");
      return;
    }

    const handleEditLab = async (labId: string) => {
      try {
        const lab = await labService.findLabById(labId);
        setFormData({
          location: lab.location || "",
          labString: lab.lab.join(", ") || "",
        });
        setSelectedLabId(labId);
        setEditMode(true);
        setShowCreateModal(true);

        // Focus on location input after modal opens
        setTimeout(() => {
          locationInputRef.current?.focus();
        }, 100);
      } catch (err: any) {
        toast.error("Failed to load lab details");
      }
    };

    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2"
          >
            <Input
              type="text"
              placeholder="Search users..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-64"
            />
          </form>
          <Button
            onClick={() => {
              setFormData({ location: "", labString: "" });
              setEditMode(false);
              setSelectedLabId(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Add New Lab
          </Button>
        </div>

        {/* Labs Table */}
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="font-medium">Labs</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {labs.length > 0 ? currentPage * PAGE_SIZE + 1 : 0} to{" "}
                {Math.min((currentPage + 1) * PAGE_SIZE, total)} of {total} labs
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Lab</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-muted-foreground">No labs found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  labs.map((lab) => (
                    <TableRow key={lab.id}>
                      <TableCell className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-1 hover:bg-transparent hover:text-primary"
                          onClick={() => handleEditLab(lab.id)}
                        >
                          <Pencil size={14} />
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {lab.location}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {lab.lab.map((labName, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20"
                            >
                              {labName}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {lab.createdTime}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {lab.updatedTime}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage + 1} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(0)}
                    disabled={currentPage === 0}
                    className="p-2"
                  >
                    <ChevronsLeft size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="p-2"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  {generatePageNumbers().map((page, index) => (
                    <React.Fragment key={index}>
                      {page === "..." ? (
                        <span className="px-2 text-muted-foreground">...</span>
                      ) : (
                        <Button
                          variant={
                            page === currentPage + 1 ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange((page as number) - 1)}
                          className="min-w-[32px] px-2"
                        >
                          {page}
                        </Button>
                      )}
                    </React.Fragment>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    className="p-2"
                  >
                    <ChevronRight size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages - 1)}
                    disabled={currentPage === totalPages - 1}
                    className="p-2"
                  >
                    <ChevronsRight size={16} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Lab Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-full max-w-md border border-border">
              <h2 className="text-xl font-semibold mb-4">
                {editMode ? "Update Lab" : "Create New Lab"}
              </h2>
              <form
                onSubmit={editMode ? handleUpdateLab : handleCreateLab}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Location
                  </label>
                  <Input
                    id="location"
                    ref={locationInputRef}
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="Enter location name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Labs (comma-separated)
                  </label>
                  <Input
                    id="labs"
                    type="text"
                    value={formData.labString}
                    onChange={(e) =>
                      setFormData({ ...formData, labString: e.target.value })
                    }
                    placeholder="Lab1, Lab2, Lab3..."
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter lab names separated by commas
                  </p>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editMode ? "Update Lab" : "Create Lab"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };
};
export default LabsPage;
