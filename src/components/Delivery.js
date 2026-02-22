import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogContent,
  TextField,
  Button,
  Pagination,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Paper,
  TableBody,
  Avatar,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Skeleton,
  Chip,
  Tooltip,
  Stack,
  InputAdornment,
  Badge,
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import Autocomplete from "@mui/material/Autocomplete";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import GetAppIcon from "@mui/icons-material/GetApp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

const DeliveryList = () => {
  // State for deliveries and loading
  const [deliveries, setDeliveries] = useState([]);
  const [locations, setLocations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  // Filter states
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    locationId: null,
    matchStatus: "All",
    search: "", // Global search term
  });

  // Temporary filter state (for applying on button click)
  const [tempFilters, setTempFilters] = useState({
    fromDate: "",
    toDate: "",
    locationId: null,
    matchStatus: "All",
    search: "",
  });

  // Search input value (for debouncing)
  const [searchInput, setSearchInput] = useState("");

  // Debounce timer ref
  const debounceTimer = useRef(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 50,
    totalRecords: 0,
    totalPages: 1,
  });

  // Fetch locations on component mount
  useEffect(() => {
    fetchLocations();
    fetchDeliveries(1, 50, filters);
  }, []); // Empty dependency for initial load

  // Debounced search effect
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (searchInput !== tempFilters.search) {
        handleFilterChange("search", searchInput);
      }
    }, 500); // 500ms delay

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchInput]);

  const fetchLocations = async () => {
    try {
      const locationRes = await fetch(
        "https://namami-infotech.com/M&M/src/location/get_location.php",
      );
      const locationData = await locationRes.json();
      if (locationData.success) {
        const locationMap = {};
        locationData.data.forEach((loc) => {
          locationMap[loc.id] = loc.abbrevation;
        });
        setLocations(locationMap);
      }
    } catch (err) {
      console.error("Error fetching locations:", err);
    }
  };

  const fetchDeliveries = async (
    page,
    limit,
    currentFilters,
    showLoading = true,
  ) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      setError("");

      const user = JSON.parse(localStorage.getItem("user"));
      const role = user?.role?.trim() === "admin" ? "admin" : "";
      const locationId = user?.location_id || "";

      const params = new URLSearchParams({
        page: page,
        limit: limit,
      });

      // Add filters to API call
      if (currentFilters.fromDate) {
        params.append("fromDate", currentFilters.fromDate);
      }
      if (currentFilters.toDate) {
        params.append("toDate", currentFilters.toDate);
      }
      if (currentFilters.locationId) {
        params.append("locationFilter", currentFilters.locationId);
      }
      if (currentFilters.matchStatus && currentFilters.matchStatus !== "All") {
        params.append("matchStatus", currentFilters.matchStatus);
      }
      if (currentFilters.search && currentFilters.search.trim() !== "") {
        params.append("search", currentFilters.search.trim());
      }

      if (role) {
        params.append("role", "admin");
      } else if (locationId) {
        params.append("LocationId", locationId);
      }

      const deliveryUrl = `https://namami-infotech.com/M&M/src/delivery/delivery_get.php?${params.toString()}`;
      console.log("Fetching from:", deliveryUrl);

      const response = await fetch(deliveryUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received data:", data);

      if (data.status === "success") {
        setDeliveries(data.data);

        setPagination({
          currentPage: data.pagination.current_page,
          perPage: data.pagination.per_page,
          totalRecords: data.pagination.total_records,
          totalPages: data.pagination.total_pages,
        });

        // Update filters to match what was applied on server
        setFilters(currentFilters);
      } else {
        setError(data.message || "Failed to fetch deliveries");
      }
    } catch (err) {
      setError("Error fetching data: " + err.message);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getMatchStatus = (delivery) => {
    const vehicleNumbers = [
      delivery.VehicleNo1,
      delivery.VehicleNo2,
      delivery.VehicleNo3,
      delivery.VehicleNo4,
      delivery.VehicleNo5,
    ].filter(Boolean);

    const manualNumbers = [
      delivery.ManualNumber1,
      delivery.ManualNumber2,
      delivery.ManualNumber3,
      delivery.ManualNumber4,
      delivery.ManualNumber5,
    ].filter(Boolean);

    if (vehicleNumbers.length === 0 && manualNumbers.length === 0) return "N/A";

    return vehicleNumbers.length === manualNumbers.length &&
      vehicleNumbers.every((v, i) => v === manualNumbers[i])
      ? "OK"
      : "Not OK";
  };

  const handleFilterChange = (key, value) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearchChange = (event) => {
    setSearchInput(event.target.value);
  };

  const clearSearch = () => {
    setSearchInput("");
    handleFilterChange("search", "");
  };

  const applyFilters = () => {
    // Reset to page 1 and fetch with new filters
    fetchDeliveries(1, pagination.perPage, tempFilters, true);
  };

  const clearFilters = () => {
    const emptyFilters = {
      fromDate: "",
      toDate: "",
      locationId: null,
      matchStatus: "All",
      search: "",
    };
    setTempFilters(emptyFilters);
    setSearchInput("");
    fetchDeliveries(1, pagination.perPage, emptyFilters, true);
  };

  const handleRefresh = () => {
    fetchDeliveries(pagination.currentPage, pagination.perPage, filters, true);
  };

  const handlePageChange = (event, value) => {
    setPagination((prev) => ({ ...prev, currentPage: value }));
    fetchDeliveries(value, pagination.perPage, filters, false);
  };

  const handlePerPageChange = (event) => {
    const newPerPage = event.target.value;
    setPagination((prev) => ({
      ...prev,
      currentPage: 1,
      perPage: newPerPage,
    }));
    fetchDeliveries(1, newPerPage, filters, true);
  };

  const exportToCSV = async () => {
    try {
      setLoading(true);

      // Fetch all data for export (you might want to implement a separate export endpoint)
      const user = JSON.parse(localStorage.getItem("user"));
      const role = user?.role?.trim() === "admin" ? "admin" : "";
      const locationId = user?.location_id || "";

      const params = new URLSearchParams({
        page: 1,
        limit: 1000, // Fetch more for export
      });

      // Add filters
      if (filters.fromDate) params.append("fromDate", filters.fromDate);
      if (filters.toDate) params.append("toDate", filters.toDate);
      if (filters.locationId)
        params.append("locationFilter", filters.locationId);
      if (filters.matchStatus && filters.matchStatus !== "All") {
        params.append("matchStatus", filters.matchStatus);
      }
      if (filters.search && filters.search.trim() !== "") {
        params.append("search", filters.search.trim());
      }

      if (role) {
        params.append("role", "admin");
      } else if (locationId) {
        params.append("LocationId", locationId);
      }

      const deliveryUrl = `https://namami-infotech.com/M&M/src/delivery/delivery_get.php?${params.toString()}`;

      const response = await fetch(deliveryUrl);
      const data = await response.json();

      if (data.status === "success") {
        let csvContent =
          "Sr No.,EmpId,Emp Name,Type of Delivery,Number of Vehicles,Type Of Vehicle,Vehicle Numbers,Manual Numbers,Packets,Location,Datetime,Status\n";

        data.data.forEach((d, index) => {
          const vehicleNumbers = [
            d.VehicleNo1,
            d.VehicleNo2,
            d.VehicleNo3,
            d.VehicleNo4,
            d.VehicleNo5,
          ].filter(Boolean);

          const manualNumbers = [
            d.ManualNumber1,
            d.ManualNumber2,
            d.ManualNumber3,
            d.ManualNumber4,
            d.ManualNumber5,
          ].filter(Boolean);

          const numbersMatch = getMatchStatus(d);

          const row = [
            index + 1,
            d.EmpId,
            `"${d.EmpName}"`,
            `"${d.TypeOfDelivery}"`,
            d.NumberOfVehicle,
            `"${d.TypeOfVehicle}"`,
            `"${vehicleNumbers.join(",")}"`,
            `"${manualNumbers.join(",")}"`,
            `"${d.CompName}"`,
            `"${locations[d.LocationId] || "Unknown"}"`,
            `"${d.Datetime}"`,
            numbersMatch,
          ].join(",");

          csvContent += row + "\n";
        });

        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        saveAs(blob, `deliveries_${dayjs().format("YYYY-MM-DD_HH-mm")}.csv`);
      }
    } catch (err) {
      console.error("Export error:", err);
      alert("Error exporting data");
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setOpenDialog(true);
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(
        "https://namami-infotech.com/M&M/src/delivery/update_status.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ID: id, Status: newStatus }),
        },
      );

      const result = await response.json();
      if (result.status === "success") {
        // Refresh current page to show updated status
        fetchDeliveries(
          pagination.currentPage,
          pagination.perPage,
          filters,
          false,
        );
      } else {
        alert(result.message || "Failed to update status");
      }
    } catch (err) {
      alert("Error updating status");
    }
  };

  const handleComplete = (id) => {
    if (
      window.confirm("Are you sure you want to mark this delivery as complete?")
    ) {
      updateStatus(id, "Complete");
    }
  };

  const isCompleteButtonDisabled = (delivery) => {
    if (delivery.Status === "Complete") return true;

    const entryTime = dayjs(delivery.Datetime);
    const currentTime = dayjs();
    const diffInHours = currentTime.diff(entryTime, "hour");

    return diffInHours < 3;
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this delivery?")) {
      updateStatus(id, "Delete");
    }
  };

  // Check if filters are active
  const hasActiveFilters = () => {
    return (
      filters.fromDate ||
      filters.toDate ||
      filters.locationId ||
      filters.matchStatus !== "All" ||
      (filters.search && filters.search.trim() !== "")
    );
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.fromDate) count++;
    if (filters.toDate) count++;
    if (filters.locationId) count++;
    if (filters.matchStatus !== "All") count++;
    if (filters.search && filters.search.trim() !== "") count++;
    return count;
  };

  // Highlight search term in text
  const highlightText = (text, searchTerm) => {
    if (!searchTerm || !text) return text;

    const parts = text.toString().split(new RegExp(`(${searchTerm})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <span
          key={index}
          style={{ backgroundColor: "yellow", fontWeight: "bold" }}
        >
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  if (loading && deliveries.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Typography
              variant="h5"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <FilterListIcon /> Delivery List
            </Typography>
            {hasActiveFilters() && (
              <Badge badgeContent={getActiveFilterCount()} color="primary">
                <Chip
                  label={`Filtered (${pagination.totalRecords} records)`}
                  size="small"
                  color="info"
                  variant="outlined"
                />
              </Badge>
            )}
          </Box>

          <Box display="flex" gap={1}>
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              sx={{ backgroundColor: "teal" }}
              onClick={exportToCSV}
              startIcon={<GetAppIcon />}
              disabled={deliveries.length === 0}
            >
              Export CSV ({pagination.totalRecords})
            </Button>
          </Box>
        </Box>

        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        >
          {/* Global Search Field */}
          <TextField
            size="small"
            placeholder="Global search..."
            value={searchInput}
            onChange={handleSearchChange}
            sx={{ width: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchInput && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={clearSearch}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Autocomplete
            value={
              tempFilters.locationId
                ? {
                    id: tempFilters.locationId,
                    name: locations[tempFilters.locationId],
                  }
                : null
            }
            onChange={(event, newValue) =>
              handleFilterChange(
                "locationId",
                newValue ? Number(newValue.id) : null,
              )
            }
            options={Object.keys(locations).map((id) => ({
              id,
              name: locations[id],
            }))}
            getOptionLabel={(option) => option.name || ""}
            renderInput={(params) => (
              <TextField {...params} label="Filter by Location" size="small" />
            )}
            sx={{ width: 200 }}
          />

          <Autocomplete
            options={["All", "OK", "Not OK"]}
            value={tempFilters.matchStatus}
            onChange={(event, newValue) =>
              handleFilterChange("matchStatus", newValue || "All")
            }
            renderInput={(params) => (
              <TextField {...params} label="Match Status" size="small" />
            )}
            sx={{ width: 180 }}
          />

          <TextField
            type="date"
            label="From Date"
            InputLabelProps={{ shrink: true }}
            value={tempFilters.fromDate}
            onChange={(e) => handleFilterChange("fromDate", e.target.value)}
            size="small"
            sx={{ width: 150 }}
          />

          <TextField
            type="date"
            label="To Date"
            InputLabelProps={{ shrink: true }}
            value={tempFilters.toDate}
            onChange={(e) => handleFilterChange("toDate", e.target.value)}
            size="small"
            sx={{ width: 150 }}
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Per Page</InputLabel>
            <Select
              value={pagination.perPage}
              label="Per Page"
              onChange={handlePerPageChange}
            >
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={75}>75</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={applyFilters}
            startIcon={<SearchIcon />}
            disabled={
              tempFilters.fromDate === filters.fromDate &&
              tempFilters.toDate === filters.toDate &&
              tempFilters.locationId === filters.locationId &&
              tempFilters.matchStatus === filters.matchStatus &&
              tempFilters.search === filters.search
            }
          >
            Apply Filters
          </Button>

          {hasActiveFilters() && (
            <Button
              variant="outlined"
              onClick={clearFilters}
              startIcon={<ClearIcon />}
            >
              Clear All
            </Button>
          )}
        </Stack>

        {/* Active filters display */}
        {hasActiveFilters() && (
          <Box
            mt={2}
            display="flex"
            gap={1}
            flexWrap="wrap"
            alignItems="center"
          >
            <Typography variant="body2" color="textSecondary">
              Active filters:
            </Typography>
            {filters.search && (
              <Chip
                size="small"
                icon={<SearchIcon />}
                label={`Search: "${filters.search}"`}
                onDelete={() => {
                  const newFilters = { ...filters, search: "" };
                  setTempFilters(newFilters);
                  setSearchInput("");
                  fetchDeliveries(1, pagination.perPage, newFilters, true);
                }}
              />
            )}
            {filters.fromDate && (
              <Chip
                size="small"
                label={`From: ${dayjs(filters.fromDate).format("DD/MM/YYYY")}`}
                onDelete={() => {
                  const newFilters = { ...filters, fromDate: "" };
                  setTempFilters(newFilters);
                  fetchDeliveries(1, pagination.perPage, newFilters, true);
                }}
              />
            )}
            {filters.toDate && (
              <Chip
                size="small"
                label={`To: ${dayjs(filters.toDate).format("DD/MM/YYYY")}`}
                onDelete={() => {
                  const newFilters = { ...filters, toDate: "" };
                  setTempFilters(newFilters);
                  fetchDeliveries(1, pagination.perPage, newFilters, true);
                }}
              />
            )}
            {filters.locationId && (
              <Chip
                size="small"
                label={`Location: ${locations[filters.locationId]}`}
                onDelete={() => {
                  const newFilters = { ...filters, locationId: null };
                  setTempFilters(newFilters);
                  fetchDeliveries(1, pagination.perPage, newFilters, true);
                }}
              />
            )}
            {filters.matchStatus !== "All" && (
              <Chip
                size="small"
                label={`Status: ${filters.matchStatus}`}
                onDelete={() => {
                  const newFilters = { ...filters, matchStatus: "All" };
                  setTempFilters(newFilters);
                  fetchDeliveries(1, pagination.perPage, newFilters, true);
                }}
              />
            )}
          </Box>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  backgroundColor: "teal",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Sr No.
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "teal",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Employee
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "teal",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Emp ID
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "teal",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Delivery Type
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "teal",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Vehicle Type
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "teal",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Vehicle with Employee
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "teal",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Vehicle Numbers
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "teal",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Manual Numbers
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "teal",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Comp Id
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "teal",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Vehicle Images
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "teal",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Location
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "teal",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Date & Time
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "teal",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Match Status
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "teal",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deliveries.length > 0 ? (
              deliveries.map((delivery, index) => (
                <TableRow key={delivery.ID} hover>
                  <TableCell>
                    {(pagination.currentPage - 1) * pagination.perPage +
                      index +
                      1}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar
                        src={delivery.EmpPic}
                        alt="Employee"
                        sx={{
                          cursor: "pointer",
                          width: 40,
                          height: 40,
                          boxShadow:
                            delivery.Status === "Complete"
                              ? "0 0 0 2px #4caf50"
                              : "0 0 0 2px #f44336",
                        }}
                        onClick={() => handleImageClick(delivery.EmpPic)}
                      />
                      <Typography variant="body2">
                        {filters.search
                          ? highlightText(delivery.EmpName, filters.search)
                          : delivery.EmpName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {filters.search
                      ? highlightText(delivery.EmpId, filters.search)
                      : delivery.EmpId}
                  </TableCell>
                  <TableCell>
                    {filters.search
                      ? highlightText(delivery.TypeOfDelivery, filters.search)
                      : delivery.TypeOfDelivery}
                  </TableCell>
                  <TableCell>
                    {filters.search
                      ? highlightText(delivery.TypeOfVehicle, filters.search)
                      : delivery.TypeOfVehicle}
                  </TableCell>
                  <TableCell>
                    {delivery.CombinedVehiclePic ? (
                      <img
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "5px",
                          cursor: "pointer",
                          objectFit: "cover",
                        }}
                        src={delivery.CombinedVehiclePic}
                        onClick={() =>
                          handleImageClick(delivery.CombinedVehiclePic)
                        }
                        alt="Combined Vehicle"
                      />
                    ) : (
                      <Typography variant="caption" color="textSecondary">
                        No image
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {[
                      delivery.VehicleNo1,
                      delivery.VehicleNo2,
                      delivery.VehicleNo3,
                      delivery.VehicleNo4,
                      delivery.VehicleNo5,
                    ]
                      .filter(Boolean)
                      .map((vehicle, idx) => (
                        <Typography key={idx} variant="body2">
                          {filters.search
                            ? highlightText(vehicle, filters.search)
                            : vehicle}
                        </Typography>
                      ))}
                  </TableCell>
                  <TableCell>
                    {[1, 2, 3, 4, 5].map((num) => {
                      const vehicleNo = delivery[`VehicleNo${num}`];
                      const manualNo = delivery[`ManualNumber${num}`];

                      return manualNo ? (
                        <Typography
                          key={num}
                          variant="body2"
                          sx={{
                            color:
                              vehicleNo && manualNo && vehicleNo === manualNo
                                ? "success.main"
                                : "error.main",
                            fontWeight: "bold",
                          }}
                        >
                          {filters.search
                            ? highlightText(manualNo, filters.search)
                            : manualNo}
                        </Typography>
                      ) : null;
                    })}
                  </TableCell>
                  <TableCell>
                    {filters.search
                      ? highlightText(delivery.CompName, filters.search)
                      : delivery.CompName}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5}>
                      {[
                        delivery.VehiclePic1,
                        delivery.VehiclePic2,
                        delivery.VehiclePic3,
                        delivery.VehiclePic4,
                        delivery.VehiclePic5,
                      ]
                        .filter(Boolean)
                        .map((pic, idx) => (
                          <IconButton
                            key={idx}
                            onClick={() => handleImageClick(pic)}
                            size="small"
                            sx={{ p: 0.5 }}
                          >
                            <ImageIcon fontSize="small" />
                          </IconButton>
                        ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <a
                      href={`https://www.google.com/maps?q=${delivery.LatLong}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "none", color: "#1976d2" }}
                    >
                      {locations[Number(delivery.LocationId)] ||
                        `ID: ${delivery.LocationId}`}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={delivery.Datetime}>
                      <Typography variant="body2">
                        {dayjs(delivery.Datetime).format("DD/MM/YYYY HH:mm")}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getMatchStatus(delivery)}
                      size="small"
                      color={
                        getMatchStatus(delivery) === "OK"
                          ? "success"
                          : getMatchStatus(delivery) === "Not OK"
                            ? "error"
                            : "default"
                      }
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5}>
                      <Tooltip
                        title={
                          isCompleteButtonDisabled(delivery)
                            ? "Cannot complete (3 hours required)"
                            : "Mark Complete"
                        }
                      >
                        <span>
                          <IconButton
                            color="success"
                            disabled={isCompleteButtonDisabled(delivery)}
                            onClick={() => handleComplete(delivery.ID)}
                            size="small"
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip
                        title={
                          delivery.Status === "Complete"
                            ? "Cannot delete completed delivery"
                            : "Delete"
                        }
                      >
                        <span>
                          <IconButton
                            color="error"
                            disabled={delivery.Status === "Complete"}
                            onClick={() => handleDelete(delivery.ID)}
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={14} align="center" sx={{ py: 5 }}>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    No deliveries found
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {hasActiveFilters()
                      ? "Try clearing filters or adjusting your search"
                      : "Check back later"}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mt={3}
      >
        <Typography variant="body2" color="textSecondary">
          Showing{" "}
          {deliveries.length > 0
            ? `${(pagination.currentPage - 1) * pagination.perPage + 1} to ${Math.min(pagination.currentPage * pagination.perPage, pagination.totalRecords)}`
            : "0"}{" "}
          of {pagination.totalRecords} records
          {filters.search && <span> matching "{filters.search}"</span>}
        </Typography>

        {pagination.totalPages > 1 && (
          <Pagination
            count={pagination.totalPages}
            page={pagination.currentPage}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
            size="medium"
          />
        )}

        <Typography variant="body2" color="textSecondary">
          Page {pagination.currentPage} of {pagination.totalPages}
        </Typography>
      </Box>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <img
            src={selectedImage}
            alt="Preview"
            style={{
              width: "100%",
              height: "auto",
              maxHeight: "80vh",
              objectFit: "contain",
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DeliveryList;
