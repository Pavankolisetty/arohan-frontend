import {
  Avatar,
  Box,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import LogoutRounded from '@mui/icons-material/LogoutRounded'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { BrandMark } from '../shared/BrandMark'
import { navigation } from './navigation'

const drawerWidth = 276

export function AppShell() {
  const { user, logout } = useAuth()
  const theme = useTheme()
  const mobile = useMediaQuery(theme.breakpoints.down('md'))
  const location = useLocation()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex' }}>
      {!mobile && (
        <Paper
          component="aside"
          square
          elevation={0}
          sx={{
            position: 'fixed',
            inset: '0 auto 0 0',
            width: drawerWidth,
            p: 2.5,
            borderRight: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10,
          }}
        >
          <Box sx={{ px: 1, py: 1, mb: 3 }}>
            <BrandMark />
          </Box>
          <List sx={{ display: 'grid', gap: 0.5 }}>
            {navigation.map(({ label, path, icon: Icon }) => (
              <ListItemButton
                key={path}
                component={NavLink}
                to={path}
                end={path === '/'}
                sx={{
                  borderRadius: 3,
                  minHeight: 45,
                  '&.active': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': { color: 'inherit' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: 650 }}
                />
              </ListItemButton>
            ))}
          </List>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ mt: 'auto', p: 1 }}
          >
            <Avatar sx={{ width: 38, height: 38, bgcolor: 'secondary.main' }}>
              {user?.displayName.charAt(0).toUpperCase()}
            </Avatar>
            <Box minWidth={0} flex={1}>
              <Typography fontWeight={750} noWrap variant="body2">
                {user?.displayName}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {user?.email}
              </Typography>
            </Box>
            <Tooltip title="Sign out">
              <IconButton onClick={logout} size="small" aria-label="Sign out">
                <LogoutRounded fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Paper>
      )}

      <Box
        component="main"
        sx={{
          width: '100%',
          ml: { md: `${drawerWidth}px` },
          pb: { xs: 10, md: 0 },
        }}
      >
        {mobile && (
          <Stack
            component="header"
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ px: 2, py: 1.5 }}
          >
            <BrandMark compact />
            <IconButton onClick={(event) => setAnchor(event.currentTarget)}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.main' }}>
                {user?.displayName.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
              <MenuItem onClick={logout}>Sign out</MenuItem>
            </Menu>
          </Stack>
        )}
        <Outlet />
      </Box>

      {mobile && (
        <Paper
          component="nav"
          aria-label="Primary navigation"
          elevation={8}
          sx={{
            position: 'fixed',
            zIndex: 20,
            inset: 'auto 10px 10px',
            height: 68,
            borderRadius: 4,
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            overflow: 'hidden',
          }}
        >
          {[
            navigation[0],
            navigation[1],
            navigation[2],
            navigation[4],
            navigation[8],
          ].map(({ label, path, icon: Icon }) => {
            const active =
              path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(path)
            return (
              <ListItemButton
                key={path}
                component={NavLink}
                to={path}
                sx={{
                  px: 0.5,
                  flexDirection: 'column',
                  justifyContent: 'center',
                  color: active ? 'primary.main' : 'text.secondary',
                }}
              >
                <Icon fontSize="small" />
                <Typography variant="caption" fontSize={10} mt={0.4} noWrap>
                  {label.replace('Today’s ', '')}
                </Typography>
              </ListItemButton>
            )
          })}
        </Paper>
      )}
    </Box>
  )
}
