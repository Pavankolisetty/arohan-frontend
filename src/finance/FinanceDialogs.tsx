import AddRounded from '@mui/icons-material/AddRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import type {
  FinanceBucket,
  FinanceMonthPlan,
  FinanceSetup,
  FinanceTransaction,
  FinanceTransactionInput,
  FinanceTransactionType,
  PaymentMode,
} from '../shared/types'

const today = new Date().toISOString().slice(0, 10)
const emptyTransaction: FinanceTransactionInput = {
  type: 'EXPENSE',
  bucketId: null,
  categoryId: null,
  title: '',
  amount: 0,
  occurredOn: today,
  paymentMode: 'UPI',
  transferDirection: null,
  incomeSource: '',
  note: '',
  recurringFrequency: null,
  recurringUntil: null,
}

const transactionLabels: Record<FinanceTransactionType, string> = {
  INCOME: 'Money in',
  EXPENSE: 'Spent',
  SAVINGS: 'Set aside',
  REFUND: 'Refund',
  TRANSFER: 'Cash transfer',
}

const transactionDescriptions: Record<FinanceTransactionType, string> = {
  INCOME: 'Money newly received, such as salary or freelance income',
  EXPENSE: 'Money used to pay for something',
  SAVINGS: 'Money intentionally moved aside for the future',
  REFUND: 'Money returned from an earlier expense',
  TRANSFER: 'Move money between cash and non-cash without changing spending',
}

export function TransactionDialog({
  open,
  setup,
  transaction,
  currencySymbol,
  busy,
  error,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean
  setup?: FinanceSetup
  transaction?: FinanceTransaction | null
  currencySymbol: string
  busy: boolean
  error?: string
  onClose: () => void
  onSave: (value: FinanceTransactionInput) => void
  onDelete?: (id: string) => void
}) {
  const [value, setValue] = useState<FinanceTransactionInput>(() =>
    transaction
      ? {
          type: transaction.type,
          bucketId: transaction.bucketId,
          categoryId: transaction.categoryId,
          title: transaction.title,
          amount: transaction.amount,
          occurredOn: transaction.occurredOn,
          paymentMode: transaction.paymentMode,
          transferDirection: transaction.transferDirection,
          incomeSource: transaction.incomeSource ?? '',
          note: transaction.note ?? '',
          recurringFrequency: transaction.recurringFrequency,
          recurringUntil: transaction.recurringUntil,
        }
      : { ...emptyTransaction, occurredOn: today },
  )
  const [recurring, setRecurring] = useState(
    Boolean(transaction?.recurringFrequency),
  )

  const needsBucket = value.type === 'EXPENSE' || value.type === 'REFUND'
  const categoryOptions = (setup?.categories ?? []).filter(
    (category) => category.active && category.bucketId === value.bucketId,
  )
  const valid =
    value.title.trim() &&
    value.amount > 0 &&
    value.occurredOn &&
    (!needsBucket || value.bucketId) &&
    (value.type !== 'TRANSFER' || value.transferDirection)

  function changeType(type: FinanceTransactionType) {
    setValue((current) => ({
      ...current,
      type,
      bucketId: type === 'EXPENSE' || type === 'REFUND' ? current.bucketId : null,
      categoryId: type === 'EXPENSE' || type === 'REFUND' ? current.categoryId : null,
      transferDirection: type === 'TRANSFER' ? current.transferDirection : null,
    }))
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {transaction ? 'Shape this money moment' : 'Record a money moment'}
      </DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" mb={2}>
          One clear entry is enough. Arohan will place it in the monthly story.
        </Typography>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <FormControl fullWidth>
            <InputLabel>What happened?</InputLabel>
            <Select
              label="What happened?"
              value={value.type}
              onChange={(event) =>
                changeType(event.target.value as FinanceTransactionType)
              }
            >
              {Object.entries(transactionLabels).map(([type, label]) => (
                <MenuItem key={type} value={type}>
                  <Box py={0.25}>
                    <Typography fontWeight={700}>{label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {transactionDescriptions[type as FinanceTransactionType]}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={
              value.type === 'INCOME'
                ? 'Income name'
                : value.type === 'SAVINGS'
                  ? 'Savings purpose'
                  : 'Short description'
            }
            value={value.title}
            onChange={(event) =>
              setValue({ ...value, title: event.target.value })
            }
            inputProps={{ maxLength: 120 }}
            autoFocus
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Amount"
              type="number"
              value={value.amount || ''}
              onChange={(event) =>
                setValue({ ...value, amount: Number(event.target.value) })
              }
              inputProps={{ min: 0.01, step: 0.01 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">{currencySymbol}</InputAdornment>
                ),
              }}
              fullWidth
            />
            <TextField
              label="Date"
              type="date"
              value={value.occurredOn}
              onChange={(event) =>
                setValue({ ...value, occurredOn: event.target.value })
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
          {needsBucket && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Kakeibo bucket</InputLabel>
                <Select
                  label="Kakeibo bucket"
                  value={value.bucketId ?? ''}
                  onChange={(event) =>
                    setValue({
                      ...value,
                      bucketId: event.target.value,
                      categoryId: null,
                    })
                  }
                >
                  {(setup?.buckets ?? []).map((bucket) => (
                    <MenuItem key={bucket.id} value={bucket.id}>
                      {bucket.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth disabled={!value.bucketId}>
                <InputLabel>Category (optional)</InputLabel>
                <Select
                  label="Category (optional)"
                  value={value.categoryId ?? ''}
                  onChange={(event) =>
                    setValue({
                      ...value,
                      categoryId: event.target.value || null,
                    })
                  }
                >
                  <MenuItem value="">No subcategory</MenuItem>
                  {categoryOptions.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}
          {value.type === 'INCOME' && (
            <TextField
              label="Source (optional)"
              placeholder="Primary work, freelance, gift…"
              value={value.incomeSource}
              onChange={(event) =>
                setValue({ ...value, incomeSource: event.target.value })
              }
            />
          )}
          {value.type === 'TRANSFER' ? (
            <FormControl fullWidth>
              <InputLabel>Cash movement</InputLabel>
              <Select
                label="Cash movement"
                value={value.transferDirection ?? ''}
                onChange={(event) =>
                  setValue({
                    ...value,
                    transferDirection: event.target.value as
                      | 'CASH_IN'
                      | 'CASH_OUT',
                  })
                }
              >
                <MenuItem value="CASH_IN">Into my cash wallet</MenuItem>
                <MenuItem value="CASH_OUT">Out of my cash wallet</MenuItem>
              </Select>
            </FormControl>
          ) : (
            <FormControl fullWidth>
              <InputLabel>How did it move?</InputLabel>
              <Select
                label="How did it move?"
                value={value.paymentMode}
                onChange={(event) =>
                  setValue({
                    ...value,
                    paymentMode: event.target.value as PaymentMode,
                  })
                }
              >
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="BANK">Bank</MenuItem>
                <MenuItem value="CARD">Card</MenuItem>
                <MenuItem value="DIGITAL_WALLET">Digital wallet</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>
          )}
          <TextField
            label="Note (optional)"
            multiline
            minRows={2}
            value={value.note}
            onChange={(event) => setValue({ ...value, note: event.target.value })}
          />
          <FormControlLabel
            control={
              <Switch
                checked={recurring}
                onChange={(event) => {
                  setRecurring(event.target.checked)
                  if (!event.target.checked) {
                    setValue({
                      ...value,
                      recurringFrequency: null,
                      recurringUntil: null,
                    })
                  }
                }}
              />
            }
            label="Remember this as a recurring pattern"
          />
          {recurring && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Repeats</InputLabel>
                <Select
                  label="Repeats"
                  value={value.recurringFrequency ?? 'MONTHLY'}
                  onChange={(event) =>
                    setValue({
                      ...value,
                      recurringFrequency: event.target.value as
                        | 'WEEKLY'
                        | 'MONTHLY'
                        | 'YEARLY',
                    })
                  }
                >
                  <MenuItem value="WEEKLY">Weekly</MenuItem>
                  <MenuItem value="MONTHLY">Monthly</MenuItem>
                  <MenuItem value="YEARLY">Yearly</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Until (optional)"
                type="date"
                value={value.recurringUntil ?? ''}
                onChange={(event) =>
                  setValue({
                    ...value,
                    recurringUntil: event.target.value || null,
                  })
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        {transaction && onDelete && (
          <Button
            color="error"
            startIcon={<DeleteOutlineRounded />}
            onClick={() => onDelete(transaction.id)}
            disabled={busy}
            sx={{ mr: 'auto' }}
          >
            Delete
          </Button>
        )}
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!valid || busy}
          onClick={() =>
            onSave({
              ...value,
              recurringFrequency: recurring
                ? value.recurringFrequency ?? 'MONTHLY'
                : null,
            })
          }
        >
          {transaction ? 'Save changes' : 'Add to flow'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export function PlanDialog({
  open,
  monthLabel,
  buckets,
  plan,
  currencySymbol,
  busy,
  error,
  onClose,
  onSave,
}: {
  open: boolean
  monthLabel: string
  buckets: FinanceBucket[]
  plan?: FinanceMonthPlan | null
  currencySymbol: string
  busy: boolean
  error?: string
  onClose: () => void
  onSave: (value: Omit<FinanceMonthPlan, 'monthStart'>) => void
}) {
  const blank = useMemo(
    () => ({
      expectedIncome: 0,
      savingsTarget: 0,
      intention: '',
      wentWell: '',
      learned: '',
      nextMonthChange: '',
      bucketBudgets: Object.fromEntries(buckets.map((bucket) => [bucket.id, 0])),
    }),
    [buckets],
  )
  const [value, setValue] = useState<Omit<FinanceMonthPlan, 'monthStart'>>(
    () => (plan ? { ...plan } : blank),
  )

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>Set the intention for {monthLabel}</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" mb={2.5}>
          Give every rupee a gentle direction before the month becomes busy.
        </Typography>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <MoneyField
              label="Expected income"
              value={value.expectedIncome}
              symbol={currencySymbol}
              onChange={(expectedIncome) => setValue({ ...value, expectedIncome })}
            />
            <MoneyField
              label="Savings target"
              value={value.savingsTarget}
              symbol={currencySymbol}
              onChange={(savingsTarget) => setValue({ ...value, savingsTarget })}
            />
          </Stack>
          <TextField
            label="What should money make possible this month?"
            multiline
            minRows={2}
            value={value.intention ?? ''}
            onChange={(event) =>
              setValue({ ...value, intention: event.target.value })
            }
          />
          <Box>
            <Typography fontWeight={800} mb={1}>
              Spending guides
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              {buckets.map((bucket) => (
                <MoneyField
                  key={bucket.id}
                  label={bucket.name}
                  value={value.bucketBudgets[bucket.id] ?? 0}
                  symbol={currencySymbol}
                  onChange={(amount) =>
                    setValue({
                      ...value,
                      bucketBudgets: {
                        ...value.bucketBudgets,
                        [bucket.id]: amount,
                      },
                    })
                  }
                />
              ))}
            </Box>
          </Box>
          <Divider />
          <Box>
            <Typography fontWeight={800}>Month-end reflection</Typography>
            <Typography variant="body2" color="text.secondary" mb={1.5}>
              Leave these blank until you are ready. They are never required.
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="What supported me well?"
                value={value.wentWell ?? ''}
                onChange={(event) =>
                  setValue({ ...value, wentWell: event.target.value })
                }
                multiline
              />
              <TextField
                label="What did money teach me?"
                value={value.learned ?? ''}
                onChange={(event) =>
                  setValue({ ...value, learned: event.target.value })
                }
                multiline
              />
              <TextField
                label="One gentle change for next month"
                value={value.nextMonthChange ?? ''}
                onChange={(event) =>
                  setValue({ ...value, nextMonthChange: event.target.value })
                }
                multiline
              />
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => onSave(value)} disabled={busy}>
          Save monthly intention
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function MoneyField({
  label,
  value,
  symbol,
  onChange,
}: {
  label: string
  value: number
  symbol: string
  onChange: (value: number) => void
}) {
  return (
    <TextField
      label={label}
      type="number"
      value={value || ''}
      onChange={(event) => onChange(Math.max(0, Number(event.target.value)))}
      InputProps={{
        startAdornment: <InputAdornment position="start">{symbol}</InputAdornment>,
      }}
      inputProps={{ min: 0, step: 0.01 }}
      fullWidth
    />
  )
}

export function CashDialog({
  open,
  currentBalance,
  currencySymbol,
  busy,
  error,
  onClose,
  onSave,
}: {
  open: boolean
  currentBalance: number
  currencySymbol: string
  busy: boolean
  error?: string
  onClose: () => void
  onSave: (value: {
    amount: number
    adjustedOn: string
    reason: string
    adjustmentKind: 'OPENING' | 'CORRECTION'
  }) => void
}) {
  const [target, setTarget] = useState(() => currentBalance)
  const [reason, setReason] = useState('')
  const difference = target - currentBalance
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Reconcile your cash wallet</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" mb={2}>
          Count the cash you actually hold. Arohan keeps the correction in an
          audit trail instead of changing history.
        </Typography>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Cash I hold now"
            type="number"
            value={target}
            onChange={(event) => setTarget(Number(event.target.value))}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">{currencySymbol}</InputAdornment>
              ),
            }}
          />
          <Alert severity={difference === 0 ? 'info' : 'success'}>
            {difference === 0
              ? 'Your wallet already matches.'
              : `${difference > 0 ? 'Add' : 'Remove'} ${currencySymbol}${Math.abs(
                  difference,
                ).toLocaleString()} in the audit trail.`}
          </Alert>
          <TextField
            label="Reason for adjustment"
            placeholder="Opening balance, cash count correction…"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={busy || difference === 0 || !reason.trim()}
          onClick={() =>
            onSave({
              amount: difference,
              adjustedOn: today,
              reason,
              adjustmentKind: currentBalance === 0 ? 'OPENING' : 'CORRECTION',
            })
          }
        >
          Reconcile wallet
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export function BucketSettingsDialog({
  open,
  setup,
  busy,
  error,
  onClose,
  onUpdateBucket,
  onAddCategory,
}: {
  open: boolean
  setup?: FinanceSetup
  busy: boolean
  error?: string
  onClose: () => void
  onUpdateBucket: (bucket: FinanceBucket) => void
  onAddCategory: (bucketId: string, name: string) => void
}) {
  const [drafts, setDrafts] = useState<FinanceBucket[]>(
    () => setup?.buckets.map((bucket) => ({ ...bucket })) ?? [],
  )
  const [category, setCategory] = useState<Record<string, string>>({})
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>Shape your four money buckets</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" mb={2.5}>
          Rename the labels to fit your life. Their stable meaning keeps every
          month comparable.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2}>
          {drafts.map((bucket, index) => (
            <Box
              key={bucket.id}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderLeft: `5px solid ${bucket.colorHex}`,
                borderRadius: 2,
              }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  label={bucket.systemKey.toLowerCase()}
                  value={bucket.name}
                  onChange={(event) =>
                    setDrafts((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, name: event.target.value }
                          : item,
                      ),
                    )
                  }
                  fullWidth
                />
                <TextField
                  label="Color"
                  type="color"
                  value={bucket.colorHex}
                  onChange={(event) =>
                    setDrafts((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, colorHex: event.target.value }
                          : item,
                      ),
                    )
                  }
                  sx={{ width: { sm: 110 } }}
                  InputLabelProps={{ shrink: true }}
                />
                <Button
                  variant="outlined"
                  disabled={!bucket.name.trim() || busy}
                  onClick={() => onUpdateBucket(bucket)}
                >
                  Save
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Categories:{' '}
                {(setup?.categories ?? [])
                  .filter((item) => item.bucketId === bucket.id && item.active)
                  .map((item) => item.name)
                  .join(', ') || 'none yet'}
              </Typography>
              <Stack direction="row" spacing={1} mt={1}>
                <TextField
                  size="small"
                  label="New category"
                  value={category[bucket.id] ?? ''}
                  onChange={(event) =>
                    setCategory({ ...category, [bucket.id]: event.target.value })
                  }
                  fullWidth
                />
                <Button
                  startIcon={<AddRounded />}
                  disabled={!category[bucket.id]?.trim() || busy}
                  onClick={() => {
                    onAddCategory(bucket.id, category[bucket.id])
                    setCategory({ ...category, [bucket.id]: '' })
                  }}
                >
                  Add
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  )
}
