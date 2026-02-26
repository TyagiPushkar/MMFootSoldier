import React, { useState, useEffect } from "react";
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
  InputAdornment,
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import Autocomplete from "@mui/material/Autocomplete";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import GetAppIcon from "@mui/icons-material/GetApp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";

const DeliveryList = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [locations, setLocations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [matchStatusFilter, setMatchStatusFilter] = useState("All");
  const [globalSearch, setGlobalSearch] = useState(""); // New state for global search

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

    return vehicleNumbers.length === manualNumbers.length &&
      vehicleNumbers.every((v, i) => v === manualNumbers[i])
      ? "OK"
      : "Not OK";
  };

  const itemsPerPage = 15;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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

      // Get user role and location ID
      const user = JSON.parse(localStorage.getItem("user"));
      const role = user?.role?.trim() === "admin" ? "admin" : "";
      const locationId = user?.location_id || "";
      const deliveryUrl = role
        ? "https://namami-infotech.com/M&M/src/delivery/delivery_get.php?role=admin"
        : `https://namami-infotech.com/M&M/src/delivery/delivery_get.php?LocationId=${locationId}`;

      const deliveryRes = await fetch(deliveryUrl);
      const deliveryData = await deliveryRes.json();

      if (deliveryData.status === "success") {
        setDeliveries(deliveryData.data);
        setFilteredDeliveries(deliveryData.data);
      } else {
        setError(deliveryData.message || "Failed to fetch deliveries");
      }
    } catch (err) {
      setError("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationFilterChange = (event, newValue) => {
    setSelectedLocation(newValue ? Number(newValue.id) : null);
  };

  // Global search function
  const globalSearchFilter = (delivery, searchTerm) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();

    // Search through various fields
    const searchableFields = [
      delivery.EmpName,
      delivery.EmpId,
      delivery.TypeOfDelivery,
      delivery.TypeOfVehicle,
      delivery.CompName,
      delivery.VehicleNo1,
      delivery.VehicleNo2,
      delivery.VehicleNo3,
      delivery.VehicleNo4,
      delivery.VehicleNo5,
      delivery.ManualNumber1,
      delivery.ManualNumber2,
      delivery.ManualNumber3,
      delivery.ManualNumber4,
      delivery.ManualNumber5,
      locations[delivery.LocationId],
      delivery.Datetime,
    ];

    return searchableFields.some(
      (field) => field && field.toString().toLowerCase().includes(searchLower),
    );
  };

  useEffect(() => {
    const filterDeliveries = () => {
      let filtered = [...deliveries];

      // Apply date filters
      if (fromDate && toDate) {
        filtered = filtered.filter((d) => {
          const deliveryDate = dayjs(d.Datetime.split(" ")[0]);
          return (
            deliveryDate.isAfter(dayjs(fromDate).subtract(1, "day")) &&
            deliveryDate.isBefore(dayjs(toDate).add(1, "day"))
          );
        });
      }

      // Apply location filter
      if (selectedLocation) {
        filtered = filtered.filter(
          (d) => Number(d.LocationId) === selectedLocation,
        );
      }

      // Apply match status filter
      if (matchStatusFilter !== "All") {
        filtered = filtered.filter(
          (d) => getMatchStatus(d) === matchStatusFilter,
        );
      }

      // Apply global search
      if (globalSearch) {
        filtered = filtered.filter((d) => globalSearchFilter(d, globalSearch));
      }

      setFilteredDeliveries(filtered);
      setCurrentPage(1);
    };

    filterDeliveries();
  }, [
    fromDate,
    toDate,
    selectedLocation,
    matchStatusFilter,
    globalSearch,
    deliveries,
    locations,
  ]);

  const exportToCSV = () => {
    let csvContent =
      "EmpId,Emp Name,Type of Delivery,Number of Vehicles,Type Of Vehicle,Vehicle Numbers,Manual Numbers,Packets,Location,Datetime, Status\n";

    filteredDeliveries.forEach((d) => {
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

      const numbersMatch =
        vehicleNumbers.length === manualNumbers.length &&
        vehicleNumbers.every((v, i) => v === manualNumbers[i])
          ? "OK"
          : "Not OK";

      const row = [
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

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "deliveries.csv");
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setOpenDialog(true);
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDeliveries.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

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
        setDeliveries((prevDeliveries) =>
          prevDeliveries.map((delivery) =>
            delivery.ID === id ? { ...delivery, Status: newStatus } : delivery,
          ),
        );
        fetchData();
      } else {
        alert(result.message || "Failed to update status");
      }
    } catch (err) {
      alert("Error updating status");
    }
  };

  const handleComplete = (id) => {
    updateStatus(id, "Complete");
  };

  const isCompleteButtonDisabled = (delivery) => {
    if (delivery.Status === "Complete") return true; // Already completed

    const entryTime = dayjs(delivery.Datetime); // Convert string to Day.js object
    const currentTime = dayjs();
    const diffInHours = currentTime.diff(entryTime, "hour");

    return diffInHours < 3; // Disable if less than 3 hours have passed
  };

  const handleDelete = (id) => {
    updateStatus(id, "Delete");
  };

  if (loading) {
    return (
      <Typography variant="h6" align="center">
        Loading...
      </Typography>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        display="flex"
        sx={{ justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}
        mb={3}
      >
        <Typography variant="h4" gutterBottom align="center">
          Delivery List
        </Typography>
        {error && (
          <Typography color="error" align="center">
            {error}
          </Typography>
        )}

        {/* Global Search Field */}
        <TextField
          placeholder="Global Search..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: "250px" }}
        />

        <Autocomplete
          value={
            selectedLocation
              ? { id: selectedLocation, name: locations[selectedLocation] }
              : null
          }
          onChange={handleLocationFilterChange}
          options={Object.keys(locations).map((id) => ({
            id,
            name: locations[id],
          }))}
          getOptionLabel={(option) => option.name || ""}
          renderInput={(params) => (
            <TextField {...params} label="Search by Location" fullWidth />
          )}
          sx={{ width: "200px" }}
        />
        <Autocomplete
          options={["All", "OK", "Not OK"]}
          value={matchStatusFilter}
          onChange={(event, newValue) =>
            setMatchStatusFilter(newValue || "All")
          }
          renderInput={(params) => (
            <TextField {...params} label="Match Status" fullWidth />
          )}
          sx={{ width: "180px" }}
        />

        <TextField
          type="date"
          label="From Date"
          InputLabelProps={{ shrink: true }}
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <TextField
          type="date"
          label="To Date"
          InputLabelProps={{ shrink: true }}
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
        <Button
          variant="contained"
          sx={{ backgroundColor: "teal" }}
          onClick={exportToCSV}
        >
          <GetAppIcon /> CSV
        </Button>
      </Box>

      {/* Results count */}
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Showing {filteredDeliveries.length} results
        {globalSearch && ` for "${globalSearch}"`}
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ backgroundColor: "teal", color: "white" }}>
                Sr No.
              </TableCell>
              <TableCell sx={{ backgroundColor: "teal", color: "white" }}>
                Employee
              </TableCell>
              <TableCell sx={{ backgroundColor: "teal", color: "white" }}>
                Emp ID
              </TableCell>
              <TableCell sx={{ backgroundColor: "teal", color: "white" }}>
                Delivery Type
              </TableCell>
              <TableCell sx={{ backgroundColor: "teal", color: "white" }}>
                Vehicle Type
              </TableCell>
              <TableCell sx={{ backgroundColor: "teal", color: "white" }}>
                Vehicle with Employee
              </TableCell>
              <TableCell sx={{ backgroundColor: "teal", color: "white" }}>
                Vehicle Numbers
              </TableCell>
              <TableCell sx={{ backgroundColor: "teal", color: "white" }}>
                Manually Numbers
              </TableCell>
              <TableCell sx={{ backgroundColor: "teal", color: "white" }}>
                Comp Id
              </TableCell>
              <TableCell sx={{ backgroundColor: "teal", color: "white" }}>
                Vehicle Images
              </TableCell>
              <TableCell sx={{ backgroundColor: "teal", color: "white" }}>
                Location
              </TableCell>
              <TableCell sx={{ backgroundColor: "teal", color: "white" }}>
                Date & Time
              </TableCell>
              <TableCell sx={{ backgroundColor: "teal", color: "white" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentItems.map((delivery, index) => (
              <TableRow key={delivery.ID}>
                <TableCell>
                  {filteredDeliveries.length - (indexOfFirstItem + index)}
                </TableCell>
                <TableCell>
                  <Avatar
                    src={delivery.EmpPic}
                    alt="Employee"
                    sx={{
                      cursor: "pointer",
                      boxShadow:
                        delivery.Status === "Complete"
                          ? "5px 5px 5px rgb(76, 181, 76)"
                          : "5px 5px 5px rgb(255, 13, 0)",
                    }}
                    onClick={() => handleImageClick(delivery.EmpPic)}
                  />{" "}
                  {delivery.EmpName}
                </TableCell>
                <TableCell>{delivery.EmpId}</TableCell>
                <TableCell>{delivery.TypeOfDelivery}</TableCell>
                <TableCell>{delivery.TypeOfVehicle}</TableCell>
                <TableCell>
                  <img
                    style={{
                      width: "70px",
                      height: "70px",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                    src={delivery.CombinedVehiclePic}
                    sx={{ cursor: "pointer" }}
                    onClick={() =>
                      handleImageClick(delivery.CombinedVehiclePic)
                    }
                    alt="Combined Vehicle"
                  />
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
                        {vehicle}
                      </Typography>
                    ))}
                </TableCell>
                <TableCell>
                  {[1, 2, 3, 4, 5].map((num, idx) => {
                    const vehicleNo = delivery[`VehicleNo${num}`];
                    const manualNo = delivery[`ManualNumber${num}`];

                    return (
                      <Typography
                        key={idx}
                        variant="body2"
                        sx={{
                          color:
                            vehicleNo && manualNo && vehicleNo === manualNo
                              ? "green"
                              : "red",
                          fontWeight: "bold",
                        }}
                      >
                        {manualNo}
                      </Typography>
                    );
                  })}
                </TableCell>
                <TableCell>{delivery.CompName}</TableCell>

                {/* <TableCell>
        {[delivery.Packet1, delivery.Packet2, delivery.Packet3, delivery.Packet4, delivery.Packet5]
          .filter(Boolean)
          .join(", ")}
      </TableCell> */}
                <TableCell>
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
                      >
                        <ImageIcon />
                      </IconButton>
                    ))}
                </TableCell>
                <TableCell>
                  <a
                    href={`https://www.google.com/maps?q=${delivery.LatLong}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none", color: "blue" }}
                  >
                    {locations[Number(delivery.LocationId)] ||
                      `Unknown (ID: ${delivery.LocationId})`}
                  </a>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" style={{ fontWeight: "800" }}>
                    {delivery.Datetime}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton
                    color="success"
                    disabled={isCompleteButtonDisabled(delivery)}
                    onClick={() => handleComplete(delivery.ID)}
                  >
                    <CheckCircleIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    disabled={delivery.Status === "Complete"}
                    onClick={() => handleDelete(delivery.ID)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="center" mt={3}>
        <Pagination
          count={Math.ceil(filteredDeliveries.length / itemsPerPage)}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogContent>
          <img src={selectedImage} alt="Preview" style={{ width: "400px" }} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DeliveryList;
