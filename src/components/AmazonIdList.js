import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, IconButton, Autocomplete,
  TablePagination
} from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import Swal from 'sweetalert2';

const AmazonIdList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [amazonIds, setAmazonIds] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [entries, setEntries] = useState([
    { Office: '', daAmazonId: '', CompId: '', CompName: '' }
  ]);
  const [selectedOffice, setSelectedOffice] = useState(null); // For filter
const [page, setPage] = useState(0);
const [rowsPerPage, setRowsPerPage] = useState(10);
const [bulkFile, setBulkFile] = useState(null);

  const fetchAmazonIds = async () => {
    try {
      const res = await fetch('https://namami-infotech.com/M&M/src/location/amazon_id_list.php');
      const data = await res.json();
      if (data.success) {
        setAmazonIds(data.data);
        setLoading(false);
      } else {
        setError(data.message || 'Failed to fetch Amazon IDs');
      }
    } catch {
      setError('Error fetching Amazon IDs');
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch('https://namami-infotech.com/M&M/src/location/get_location.php');
      const data = await res.json();
      if (data.success) {
        setLocations(data.data);
      } else {
        setError(data.message || 'Failed to fetch locations');
      }
    } catch {
      setError('Error fetching locations');
    }
  };

  useEffect(() => {
    fetchAmazonIds();
    fetchLocations();
  }, []);

  const handleEntryChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...entries];
    updated[index][name] = value;
    setEntries(updated);
  };

  const handleAddEntry = () => {
    setEntries([...entries, { Office: '', daAmazonId: '', CompId: '', CompName: '' }]);
  };

  const handleRemoveEntry = (index) => {
    const updated = entries.filter((_, i) => i !== index);
    setEntries(updated);
  };

  const handleSubmit = async () => {
    if (entries.some(entry => !entry.Office || !entry.daAmazonId || !entry.CompId || !entry.CompName)) {
      setError('Please fill all fields in each entry');
      return;
    }

    try {
      const response = await fetch('https://namami-infotech.com/M&M/src/location/add_amazon_id.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      });

      const data = await response.json();
      if (data.success) {
        fetchAmazonIds();
        setOpenDialog(false);
        setEntries([{ Office: '', daAmazonId: '', CompId: '', CompName: '' }]);
        setError('');
      } else {
        setError(data.message || 'Failed to insert entries');
      }
    } catch {
      setError('Submission failed');
    }
  };

 const filteredData = amazonIds.filter((item) => {
  const matchesOffice = selectedOffice
    ? item.Office === selectedOffice.abbrevation
    : true;

  const search = searchTerm.toLowerCase();

  const matchesSearch =
    item.CompName?.toLowerCase().includes(search) ||
    item.Office?.toLowerCase().includes(search) ||
    item.daAmazonId?.toLowerCase().includes(search) ||
    item.CompId?.toLowerCase().includes(search) ||
    item.UpdateDateTime?.toLowerCase().includes(search) ||
    (parseInt(item.Status) === 1 ? 'active' : 'inactive').includes(search);

  return matchesOffice && matchesSearch;
 });
  useEffect(() => {
    setPage(0);
  }, [searchTerm, selectedOffice]);
const paginatedAmazonIds = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

const toggleStatus = async (id) => {
  try {
    const res = await fetch('https://namami-infotech.com/M&M/src/location/update_comp_status.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.success) {
      fetchAmazonIds(); // Refresh the list
    } else {
      setError(data.message || 'Failed to update status');
    }
  } catch {
    setError('Error updating status');
  }
};
const exportToCSV = () => {
  const headers = ['Comp Name', 'Office', 'Amazon ID', 'Comp ID', 'Update Date', 'Status'];
  const rows = filteredData.map(item => [
    item.CompName,
    item.Office,
    item.daAmazonId,
    item.CompId,
    item.UpdateDateTime,
    parseInt(item.Status) === 1 ? 'Active' : 'Inactive'
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'amazon_id_list.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
const handleDownloadSample = () => {
  const headers = ['Office', 'Amazon ID', 'Comp ID', 'Comp Name'];
  const sampleData = [
    ['NY', 'A12345', 'C789', 'AmazonComp1'],
    ['CA', 'B54321', 'C321', 'AmazonComp2']
  ];

  const csvContent = [headers, ...sampleData]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'sample_bulk_amazon_id.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const handleBulkUpload = async () => {
  if (!bulkFile) {
    setError('No file selected');
    return;
  }

  const formData = new FormData();
  formData.append('file', bulkFile);

  try {
    const res = await fetch('https://namami-infotech.com/M&M/src/location/bulk_amazon_id.php', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (data.success) {
      fetchAmazonIds();
      setBulkFile(null);
      setError('');
      Swal.fire({
        icon: 'success',
        title: 'Upload Successful',
        text: 'Bulk Amazon IDs uploaded successfully!',
        confirmButtonColor: 'teal'
      });
    } else {
      setError(data.message || 'Bulk upload failed');
    }
  } catch (err) {
    setError('Error uploading file');
    console.error(err);
  }
};




  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4">Amazon ID List</Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Autocomplete
            value={selectedOffice}
            onChange={(e, newValue) => setSelectedOffice(newValue)}
            options={locations}
            getOptionLabel={(option) => option.abbrevation}
            sx={{ width: 200 }}
            renderInput={(params) => (
              <TextField {...params} label="Filter by Office" />
            )}
          />
          <Button variant="outlined" onClick={exportToCSV}>
            Export CSV
          </Button>
          <TextField
            label="Search..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: 250 }}
          />

          <Button
            variant="contained"
            onClick={() => setOpenDialog(true)}
            sx={{ backgroundColor: "teal" }}
          >
            Add Amazon IDs
          </Button>
          <Button variant="outlined" onClick={handleDownloadSample}>
            Download Sample Bulk
          </Button>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button variant="outlined" component="label">
              Select File
              <input
                type="file"
                hidden
                accept=".xls,.xlsx"
                onChange={(e) => setBulkFile(e.target.files[0])}
              />
            </Button>
            {bulkFile && (
              <Typography variant="body2">{bulkFile.name}</Typography>
            )}
            <Button
              variant="contained"
              color="secondary"
              onClick={handleBulkUpload}
              disabled={!bulkFile}
            >
              Submit Bulk
            </Button>
          </Box>
        </Box>
      </Box>

      {error && (
        <Typography color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead sx={{ backgroundColor: "teal" }}>
              <TableRow>
                <TableCell sx={{ color: "white" }}>Comp Name</TableCell>
                <TableCell sx={{ color: "white" }}>Office</TableCell>
                <TableCell sx={{ color: "white" }}>Amazon ID</TableCell>
                <TableCell sx={{ color: "white" }}>Comp ID</TableCell>
                <TableCell sx={{ color: "white" }}>Update Date</TableCell>
                <TableCell sx={{ color: "white" }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAmazonIds.map((item) => (
                <TableRow key={item.ID}>
                  <TableCell>{item.CompName}</TableCell>
                  <TableCell>{item.Office}</TableCell>
                  <TableCell>{item.daAmazonId}</TableCell>
                  <TableCell>{item.CompId}</TableCell>
                  <TableCell>{item.UpdateDateTime}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => toggleStatus(item.ID)}>
                      {parseInt(item.Status) === 1 ? (
                        <CheckCircle color="success" />
                      ) : (
                        <Cancel color="error" />
                      )}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TablePagination
              component="div"
              count={filteredData.length}
              page={page}
              onPageChange={(event, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Amazon ID Entries</DialogTitle>
        <DialogContent>
          {entries.map((entry, index) => (
            <Box
              key={index}
              sx={{ display: "flex", gap: 2, alignItems: "center", mt: 2 }}
            >
              <Autocomplete
                value={
                  locations.find((loc) => loc.abbrevation === entry.Office) ||
                  null
                }
                onChange={(e, newValue) => {
                  const updated = [...entries];
                  updated[index].Office = newValue ? newValue.abbrevation : "";
                  setEntries(updated);
                }}
                options={locations}
                getOptionLabel={(option) => option.abbrevation}
                renderInput={(params) => (
                  <TextField {...params} label="Office" />
                )}
              />

              <TextField
                label="Amazon ID"
                name="daAmazonId"
                value={entry.daAmazonId}
                onChange={(e) => handleEntryChange(index, e)}
              />
              <TextField
                label="Comp ID"
                name="CompId"
                value={entry.CompId}
                onChange={(e) => handleEntryChange(index, e)}
              />
              <TextField
                label="Comp Name"
                name="CompName"
                value={entry.CompName}
                onChange={(e) => handleEntryChange(index, e)}
              />
              <IconButton
                onClick={() => handleRemoveEntry(index)}
                disabled={entries.length === 1}
              >
                <Remove />
              </IconButton>
              {index === entries.length - 1 && (
                <IconButton onClick={handleAddEntry}>
                  <Add />
                </IconButton>
              )}
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Submit All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AmazonIdList;
