import { Box, Typography } from "@mui/material";

export default function Footer() {
  return (
    <Box component="footer" className="flex h-10 items-center justify-center">
      <Typography variant="body2">
        &copy; {new Date().getFullYear()} RADET. All rights reserved.
      </Typography>
    </Box>
  );
}
