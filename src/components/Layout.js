import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  CssBaseline,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
} from "@mui/material";
import { Home, Menu as MenuIcon } from "@mui/icons-material";
import BusinessIcon from '@mui/icons-material/Business';
import { NavLink, useNavigate } from "react-router-dom";
import PeopleIcon from '@mui/icons-material/People';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
const drawerWidth = 200;

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {
    username: "Guest",
    image: "",
  };

  const [anchorEl, setAnchorEl] = useState(null); // Profile menu state
  const [mobileOpen, setMobileOpen] = useState(false); // Mobile drawer state

  const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

 const drawerContent = (
  <List>
    {user.role === "admin" ? (
      [
        { to: "/employee-list", icon: <PeopleIcon />, text: "Employees" },
        { to: "/office-locations", icon: <BusinessIcon />, text: "Offices Location" },
        { to: "/out-delivery", icon: <LocalShippingIcon />, text: "Out For Delivery" },
      ].map(({ to, icon, text }) => (
        <NavLink
          key={to}
          to={to}
          style={({ isActive }) => ({
            textDecoration: "none",
            color: isActive ? "teal" : "inherit",
            backgroundColor: isActive ? "white" : "transparent",
            borderRadius: "5px",
            display: "block",
          })}
        >
          <ListItem button sx={{ borderRadius: "5px", padding: "10px 16px" }}>
            <ListItemIcon sx={{ color: "inherit" }}>{icon}</ListItemIcon>
            <ListItemText primary={text} />
          </ListItem>
        </NavLink>
      ))
    ) : (
      <NavLink
        to="/out-delivery"
        style={({ isActive }) => ({
          textDecoration: "none",
          color: isActive ? "teal" : "inherit",
          backgroundColor: isActive ? "white" : "transparent",
          borderRadius: "5px",
          display: "block",
        })}
      >
        <ListItem button sx={{ borderRadius: "5px", padding: "10px 16px" }}>
          <ListItemIcon sx={{ color: "inherit" }}>
            <LocalShippingIcon />
          </ListItemIcon>
          <ListItemText primary="Out For Delivery" />
        </ListItem>
      </NavLink>
    )}
  </List>
);


  return (
    <Box sx={{ display: "flex", overflowX: "hidden" }}>
      <CssBaseline />

      {/* Navbar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1, // Ensures navbar stays on top
          background: "teal",
          height: 64,
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          {/* Mobile Menu Button */}
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleDrawerToggle}
            sx={{ display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>

                  {/* Logo */}
                  <div style={{display:"flex", gap:"10px", alignItems:"center"}}>
          <Box
            component="img"
            src="https://namami-infotech.com/M&M/icons/logo.png"
            alt="Logo"
            sx={{
              height: 40,
              width: "auto",
              cursor: "pointer",
            }}
            />
            <span>M&M Vehicle Management</span>
                      
                      </div>

          {/* Profile and Logout */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body1" sx={{ mr: 2, display: { xs: "none", sm: "block" } }}>
              {user.full_name}
            </Typography>
            <IconButton onClick={handleProfileMenuOpen}>
              <Avatar alt={user.username} src={user.full_name || user.full_name } />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              sx={{ mt: 2 }}
            >
              <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          width: drawerWidth,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            background: "teal",
            color: "white",
          },
        }}
        open
      >
        <Toolbar /> {/* Spacing for the navbar */}
        {drawerContent}
      </Drawer>

      {/* Mobile Sidebar */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better performance on mobile
        }}
        sx={{
          display: { xs: "block", sm: "none" },
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            background: "teal",
            color: "#ECF0F1",
            marginTop: "64px", // Prevent drawer from covering navbar
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          mt: 0, // Added margin-top for the main content to avoid overlapping with the AppBar
          overflowX: "hidden",
          background:"#F3F4F6"
        }}
      >
        <Toolbar /> {/* Spacing for the navbar */}
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
