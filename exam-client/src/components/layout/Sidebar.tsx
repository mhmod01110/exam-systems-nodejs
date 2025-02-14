import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from '@mui/material';
import {
  School as ExamIcon,
  Add as CreateIcon,
  List as ListIcon,
  Assignment as SubmissionIcon,
} from '@mui/icons-material';
import { RootState } from '@/redux/store';
import { User } from '@/services/authService';

interface SidebarProps {
  open: boolean;
  width: number;
}

interface MenuItem {
  text: string;
  icon: JSX.Element;
  path: string;
  roles: User['role'][];
}

const menuItems: MenuItem[] = [
  {
    text: 'Exam List',
    icon: <ListIcon />,
    path: '/exams',
    roles: ['student', 'teacher', 'supervisor', 'admin'],
  },
  {
    text: 'Create Exam',
    icon: <CreateIcon />,
    path: '/exams/create',
    roles: ['supervisor', 'admin'],
  },
  {
    text: 'My Submissions',
    icon: <SubmissionIcon />,
    path: '/submissions',
    roles: ['student'],
  },
  {
    text: 'Review Submissions',
    icon: <SubmissionIcon />,
    path: '/submissions/review',
    roles: ['supervisor', 'admin'],
  },
];

const Sidebar = ({ open, width }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role || 'student')
  );

  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        width: open ? width : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {filteredMenuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar; 