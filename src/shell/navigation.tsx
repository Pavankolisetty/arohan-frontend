import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded'
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded'
import AutoStoriesRounded from '@mui/icons-material/AutoStoriesRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import CategoryRounded from '@mui/icons-material/CategoryRounded'
import HomeRounded from '@mui/icons-material/HomeRounded'
import SettingsRounded from '@mui/icons-material/SettingsRounded'
import SpaRounded from '@mui/icons-material/SpaRounded'

export const navigation = [
  { label: 'Home', path: '/', icon: HomeRounded },
  { label: 'Today’s Rhythm', path: '/today', icon: CalendarMonthRounded },
  { label: 'Life Areas', path: '/life-areas', icon: CategoryRounded },
  { label: 'Growth Habits', path: '/growth-habits', icon: SpaRounded },
  { label: 'Growth Studio', path: '/growth-studio', icon: AutoAwesomeRounded },
  {
    label: 'Financial Flow',
    path: '/financial-flow',
    icon: AccountBalanceWalletRounded,
  },
  {
    label: 'Reflection Space',
    path: '/reflection-space',
    icon: AutoStoriesRounded,
  },
  { label: 'Settings', path: '/settings', icon: SettingsRounded },
]
