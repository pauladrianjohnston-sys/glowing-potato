#!/usr/bin/env python3
"""
HF Weekend Expense Splitter
─────────────────────────────────────────────────────────────────────────────
Edit the ATTENDEES and EXPENSES lists below, then run this script to
regenerate HF_Weekend_Expense_Splitter.xlsx with fresh balances, a
simplified settlement plan, and a ready-to-paste WhatsApp message.

Split rules:
  "even"          → total divided equally among all 16 attendees
  {"Name": w, …}  → custom weights; missing names get "default" weight;
                     weight 0 = person excluded from that expense
"""

import os
from datetime import date
import openpyxl
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter

OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "HF_Weekend_Expense_Splitter.xlsx")

# ── Attendees ─────────────────────────────────────────────────────────────────
# Replace placeholder names with the real 16.  Klaus and Louise stay as-is.
ATTENDEES = [
    "Klaus", "Louise", "Alex", "Sam", "Jordan", "Taylor",
    "Morgan", "Jamie", "Casey", "Riley", "Drew", "Quinn",
    "Avery", "Blake", "Charlie", "Dylan",
]

# ── Expenses ──────────────────────────────────────────────────────────────────
# Add as many rows as needed.  amounts are in £.
# Tip: set "paid_by" to whoever physically paid.
EXPENSES = [
    {
        "date": "Fri",
        "description": "Accommodation",
        "category": "Accommodation",
        "paid_by": "Alex",
        "amount": 960.00,
        "notes": "Full weekend accommodation, all 16",
        "splits": "even",
    },
    {
        "date": "Sat",
        "description": "Saturday Lunch",
        "category": "Food",
        "paid_by": "Sam",
        "amount": 240.00,
        "notes": "",
        "splits": "even",
    },
    {
        "date": "Sat",
        "description": "Saturday Drinks",
        "category": "Drinks",
        "paid_by": "Taylor",
        "amount": 320.00,
        "notes": "Klaus smaller share (approx ⅓ of standard portion)",
        # Klaus weight 0.3 vs everyone else 1.0
        "splits": {"Klaus": 0.3, "default": 1.0},
    },
    {
        "date": "Sat",
        "description": "Saturday Dinner",
        "category": "Food",
        "paid_by": "Morgan",
        "amount": 480.00,
        "notes": "",
        "splits": "even",
    },
    {
        "date": "Sun",
        "description": "Sunday Breakfast",
        "category": "Food",
        "paid_by": "Jamie",
        "amount": 280.00,
        "notes": "Klaus & Louise not present → split 14 ways",
        # Klaus and Louise excluded
        "splits": {"Klaus": 0, "Louise": 0, "default": 1.0},
    },
    {
        "date": "Sun",
        "description": "Sunday Lunch",
        "category": "Food",
        "paid_by": "Casey",
        "amount": 360.00,
        "notes": "",
        "splits": "even",
    },
]

# ── Styling helpers ───────────────────────────────────────────────────────────
def fill(hex_color):
    return PatternFill("solid", fgColor=hex_color)

def font(bold=False, color="000000", size=11, italic=False):
    return Font(bold=bold, color=color, size=size, italic=italic, name="Calibri")

THIN = Side(style="thin")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

def hdr(ws, row, col, value, bg="1F3864", fg="FFFFFF", bold=True, size=11, wrap=False):
    c = ws.cell(row=row, column=col, value=value)
    c.fill = fill(bg)
    c.font = font(bold=bold, color=fg, size=size)
    c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=wrap)
    c.border = BORDER
    return c

# ── Core calculations ─────────────────────────────────────────────────────────

def compute_splits(expenses, attendees):
    splits_matrix = {}
    paid_totals = {p: 0.0 for p in attendees}
    owed_totals = {p: 0.0 for p in attendees}

    for idx, exp in enumerate(expenses):
        total = exp["amount"]
        paid_totals[exp["paid_by"]] = round(paid_totals[exp["paid_by"]] + total, 2)

        if exp["splits"] == "even":
            weights = {p: 1.0 for p in attendees}
        else:
            cfg = exp["splits"]
            default_w = cfg.get("default", 1.0)
            weights = {p: cfg.get(p, default_w) for p in attendees}

        total_weight = sum(weights.values())
        shares = {}
        for p in attendees:
            shares[p] = round(total * weights[p] / total_weight, 2) if total_weight else 0.0

        # Fix penny rounding so shares sum exactly to total
        diff = round(total - sum(shares.values()), 2)
        if diff:
            for p in attendees:
                if shares[p] > 0:
                    shares[p] = round(shares[p] + diff, 2)
                    break

        splits_matrix[idx] = shares
        for p in attendees:
            owed_totals[p] = round(owed_totals[p] + shares[p], 2)

    net_balances = {p: round(paid_totals[p] - owed_totals[p], 2) for p in attendees}
    return splits_matrix, paid_totals, owed_totals, net_balances


def simplify_debts(net_balances):
    """Greedy minimum-transaction debt settlement."""
    creditors = sorted(
        [[v, k] for k, v in net_balances.items() if v > 0.005], reverse=True
    )
    debtors = sorted(
        [[abs(v), k] for k, v in net_balances.items() if v < -0.005], reverse=True
    )
    txns = []
    i = j = 0
    while i < len(creditors) and j < len(debtors):
        transfer = round(min(creditors[i][0], debtors[j][0]), 2)
        txns.append((debtors[j][1], creditors[i][1], transfer))
        creditors[i][0] = round(creditors[i][0] - transfer, 2)
        debtors[j][0] = round(debtors[j][0] - transfer, 2)
        if creditors[i][0] < 0.01:
            i += 1
        if debtors[j][0] < 0.01:
            j += 1
    return txns

# ── Sheet builders ────────────────────────────────────────────────────────────

def build_overview(wb):
    ws = wb.create_sheet("Overview")
    ws.sheet_view.showGridLines = False
    ws.column_dimensions["A"].width = 3
    ws.column_dimensions["B"].width = 70

    ws.merge_cells("B2:B2")
    c = ws["B2"]
    c.value = "HF WEEKEND — EXPENSE SPLITTER"
    c.fill = fill("1F3864")
    c.font = Font(bold=True, color="FFFFFF", size=20, name="Calibri")
    c.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[2].height = 44

    c = ws["B3"]
    c.value = f"Generated {date.today().strftime('%d %b %Y')}  ·  {len(ATTENDEES)} attendees  ·  {len(EXPENSES)} expenses  ·  Total £{sum(e['amount'] for e in EXPENSES):,.2f}"
    c.fill = fill("2F5496")
    c.font = Font(color="FFFFFF", size=11, name="Calibri")
    c.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[3].height = 22

    sections = [
        ("HOW TO USE THIS FILE", "1F3864", "FFFFFF", True),
        ("1.  Attendees sheet  — update the 16 names (Klaus and Louise already noted).", "EEF3FB", "000000", False),
        ("2.  Expenses sheet   — add/edit expense rows. One row per payment.", "EEF3FB", "000000", False),
        ("3.  Splits sheet     — shows each person's share per expense (auto-calculated).", "EEF3FB", "000000", False),
        ("4.  Balances sheet   — net position for every attendee.", "EEF3FB", "000000", False),
        ("5.  Settlement sheet — minimum payments to clear all debts.", "EEF3FB", "000000", False),
        ("6.  WhatsApp sheet   — ready-to-paste message for the group.", "EEF3FB", "000000", False),
        ("7.  Re-run expense_splitter.py any time to refresh all calculations.", "EEF3FB", "000000", False),
        ("", "FFFFFF", "000000", False),
        ("SPLIT RULES FOR THIS WEEKEND", "1F3864", "FFFFFF", True),
        ("Standard expenses:     split evenly 16 ways", "FFFDE7", "000000", False),
        ("Saturday Drinks:       Klaus gets a smaller share (~1/3 of standard)", "FFFDE7", "000000", False),
        ("Sunday Breakfast:      Klaus & Louise not present → cost split 14 ways", "FFFDE7", "000000", False),
        ("", "FFFFFF", "000000", False),
        ("ADDING MORE EXPENSES", "1F3864", "FFFFFF", True),
        ('Add a row to the EXPENSES list in expense_splitter.py, then re-run.', "EEF3FB", "000000", False),
        ('Use "splits": "even"  for a standard split.', "EEF3FB", "000000", False),
        ('Use "splits": {"PersonName": weight, "default": 1.0}  for custom splits.', "EEF3FB", "000000", False),
        ('Weight 0 = person not included. Weight 0.3 = gets 30% of a standard share.', "EEF3FB", "000000", False),
    ]

    row = 5
    for text, bg, fg, bold in sections:
        c = ws.cell(row=row, column=2, value=text)
        c.fill = fill(bg)
        c.font = Font(bold=bold, color=fg, size=11, name="Calibri")
        c.alignment = Alignment(horizontal="left", vertical="center", indent=1)
        ws.row_dimensions[row].height = 20
        row += 1

    return ws


def build_attendees(wb, attendees):
    ws = wb.create_sheet("Attendees")
    ws.sheet_view.showGridLines = False
    ws.column_dimensions["A"].width = 6
    ws.column_dimensions["B"].width = 22
    ws.column_dimensions["C"].width = 45

    hdr(ws, 1, 1, "#", size=10)
    hdr(ws, 1, 2, "Name")
    hdr(ws, 1, 3, "Notes")

    notes_map = {
        "Klaus": "Smaller share Sat Drinks; absent Sun Breakfast",
        "Louise": "Absent Sunday Breakfast",
    }

    for i, name in enumerate(attendees, 1):
        r = i + 1
        bg = "F2F2F2" if i % 2 == 0 else "FFFFFF"
        for col in range(1, 4):
            ws.cell(row=r, column=col).fill = fill(bg)
            ws.cell(row=r, column=col).border = BORDER
        ws.cell(row=r, column=1, value=i).alignment = Alignment(horizontal="center")
        ws.cell(row=r, column=2, value=name)
        note_cell = ws.cell(row=r, column=3, value=notes_map.get(name, ""))
        if name in notes_map:
            note_cell.font = Font(italic=True, color="444444", name="Calibri")

    return ws


def build_expenses(wb, expenses):
    ws = wb.create_sheet("Expenses")
    ws.sheet_view.showGridLines = False

    cols = ["#", "Day", "Description", "Category", "Paid By", "Amount (£)", "Split Rule", "Notes"]
    widths = [5, 6, 28, 16, 16, 14, 22, 40]
    for i, (col, w) in enumerate(zip(cols, widths), 1):
        ws.column_dimensions[get_column_letter(i)].width = w
        hdr(ws, 1, i, col, wrap=(i == 8))
    ws.row_dimensions[1].height = 22

    cat_colors = {
        "Accommodation": "BDD7EE",
        "Food": "E2EFDA",
        "Drinks": "FCE4D6",
        "Transport": "FFF2CC",
        "Activities": "E8D5F5",
        "Misc": "F2F2F2",
    }

    total = 0
    for idx, exp in enumerate(expenses, 1):
        r = idx + 1
        bg = cat_colors.get(exp["category"], "FFFFFF")
        split_label = "Even (÷16)" if exp["splits"] == "even" else "Custom — see Splits sheet"
        values = [idx, exp["date"], exp["description"], exp["category"],
                  exp["paid_by"], exp["amount"], split_label, exp["notes"]]
        for col, val in enumerate(values, 1):
            c = ws.cell(row=r, column=col, value=val)
            c.fill = fill(bg)
            c.border = BORDER
            if col == 6:
                c.number_format = '£#,##0.00'
                c.alignment = Alignment(horizontal="right")
            if col == 8:
                c.font = Font(italic=True, color="555555", name="Calibri")
        total += exp["amount"]

    tr = len(expenses) + 2
    for col in range(1, 9):
        ws.cell(row=tr, column=col).fill = fill("1F3864")
        ws.cell(row=tr, column=col).border = BORDER
    ws.cell(row=tr, column=5, value="TOTAL").font = font(bold=True, color="FFFFFF")
    c = ws.cell(row=tr, column=6, value=total)
    c.font = font(bold=True, color="FFFFFF")
    c.number_format = '£#,##0.00'
    c.alignment = Alignment(horizontal="right")

    return ws


def build_splits(wb, expenses, attendees, splits_matrix):
    ws = wb.create_sheet("Splits")
    ws.sheet_view.showGridLines = False

    ws.column_dimensions["A"].width = 18
    for idx in range(len(expenses)):
        ws.column_dimensions[get_column_letter(idx + 2)].width = 14
    total_col = len(expenses) + 2
    ws.column_dimensions[get_column_letter(total_col)].width = 14

    # Row 1: expense titles
    hdr(ws, 1, 1, "Person", "1F3864", wrap=True)
    for idx, exp in enumerate(expenses):
        hdr(ws, 1, idx + 2, f"{exp['date']}: {exp['description']}", "2F5496", size=9, wrap=True)
    hdr(ws, 1, total_col, "Total Owed", "ED7D31", size=10)
    ws.row_dimensions[1].height = 42

    # Row 2: paid by
    for col, label in [(1, "Paid by:")]:
        c = ws.cell(row=2, column=col, value=label)
        c.fill = fill("D9E1F2"); c.font = font(bold=True, size=9); c.border = BORDER
    for idx, exp in enumerate(expenses):
        c = ws.cell(row=2, column=idx + 2, value=exp["paid_by"])
        c.fill = fill("D9E1F2"); c.font = font(bold=True, size=9)
        c.alignment = Alignment(horizontal="center"); c.border = BORDER
    c = ws.cell(row=2, column=total_col, value="")
    c.fill = fill("FCE4D6"); c.border = BORDER

    # Row 3: total amount
    c = ws.cell(row=3, column=1, value="Total:")
    c.fill = fill("D9E1F2"); c.font = font(bold=True, size=9); c.border = BORDER
    for idx, exp in enumerate(expenses):
        c = ws.cell(row=3, column=idx + 2, value=exp["amount"])
        c.number_format = '£#,##0.00'
        c.fill = fill("D9E1F2"); c.font = font(bold=True, size=9)
        c.alignment = Alignment(horizontal="right"); c.border = BORDER
    c = ws.cell(row=3, column=total_col, value="")
    c.fill = fill("FCE4D6"); c.border = BORDER

    # Data rows
    for pidx, person in enumerate(attendees):
        row = pidx + 4
        bg = "F2F2F2" if pidx % 2 == 0 else "FFFFFF"
        c = ws.cell(row=row, column=1, value=person)
        c.fill = fill("D9E1F2"); c.font = font(bold=True); c.border = BORDER

        person_total = 0.0
        for eidx in range(len(expenses)):
            share = splits_matrix[eidx][person]
            c = ws.cell(row=row, column=eidx + 2)
            c.border = BORDER
            if share == 0:
                c.value = "—"
                c.fill = fill("EEEEEE")
                c.font = font(color="AAAAAA", italic=True)
                c.alignment = Alignment(horizontal="center")
            else:
                c.value = share
                c.number_format = '£#,##0.00'
                c.alignment = Alignment(horizontal="right")
                c.fill = fill(bg)
            person_total += share

        c = ws.cell(row=row, column=total_col, value=round(person_total, 2))
        c.number_format = '£#,##0.00'
        c.alignment = Alignment(horizontal="right")
        c.fill = fill("FCE4D6"); c.font = font(bold=True); c.border = BORDER

    # Column sum check row
    check_row = len(attendees) + 4
    c = ws.cell(row=check_row, column=1, value="Col Total (check)")
    c.fill = fill("1F3864"); c.font = font(bold=True, color="FFFFFF"); c.border = BORDER
    grand = 0.0
    for eidx, exp in enumerate(expenses):
        col_sum = sum(splits_matrix[eidx][p] for p in attendees)
        c = ws.cell(row=check_row, column=eidx + 2, value=round(col_sum, 2))
        c.number_format = '£#,##0.00'
        c.alignment = Alignment(horizontal="right")
        c.fill = fill("1F3864"); c.font = font(bold=True, color="FFFFFF"); c.border = BORDER
        grand += col_sum
    c = ws.cell(row=check_row, column=total_col, value=round(grand, 2))
    c.number_format = '£#,##0.00'
    c.alignment = Alignment(horizontal="right")
    c.fill = fill("ED7D31"); c.font = font(bold=True, color="FFFFFF"); c.border = BORDER

    return ws


def build_balances(wb, attendees, paid_totals, owed_totals, net_balances):
    ws = wb.create_sheet("Balances")
    ws.sheet_view.showGridLines = False

    for col, w in zip("ABCDE", [22, 16, 16, 16, 30]):
        ws.column_dimensions[col].width = w

    for i, h in enumerate(["Person", "Total Paid (£)", "Total Share (£)", "Net Balance (£)", "Status"], 1):
        hdr(ws, 1, i, h)

    sorted_people = sorted(attendees, key=lambda p: net_balances[p], reverse=True)

    for ridx, person in enumerate(sorted_people, 1):
        r = ridx + 1
        net = net_balances[person]
        bg_row = "F2F2F2" if ridx % 2 == 0 else "FFFFFF"

        if net > 0.01:
            net_bg, net_fg = "C6EFCE", "276221"
            status_bg, status = "C6EFCE", f"Gets back £{net:.2f}"
        elif net < -0.01:
            net_bg, net_fg = "FFC7CE", "9C0006"
            status_bg, status = "FFC7CE", f"Owes £{abs(net):.2f}"
        else:
            net_bg, net_fg = "FFFF99", "7D6608"
            status_bg, status = "FFFF99", "Settled"

        c = ws.cell(row=r, column=1, value=person)
        c.fill = fill("D9E1F2"); c.font = font(bold=True); c.border = BORDER

        for col, val in [(2, paid_totals[person]), (3, owed_totals[person])]:
            c = ws.cell(row=r, column=col, value=val)
            c.number_format = '£#,##0.00'; c.alignment = Alignment(horizontal="right")
            c.fill = fill(bg_row); c.border = BORDER

        c = ws.cell(row=r, column=4, value=net)
        c.number_format = '£#,##0.00'; c.alignment = Alignment(horizontal="right")
        c.fill = fill(net_bg); c.font = font(bold=True, color=net_fg); c.border = BORDER

        c = ws.cell(row=r, column=5, value=status)
        c.fill = fill(status_bg); c.font = font(bold=(net != 0)); c.border = BORDER

    # Totals row
    tr = len(attendees) + 2
    for col in range(1, 6):
        ws.cell(row=tr, column=col).fill = fill("1F3864")
        ws.cell(row=tr, column=col).border = BORDER
    ws.cell(row=tr, column=1, value="TOTAL").font = font(bold=True, color="FFFFFF")
    for col, val in [
        (2, sum(paid_totals.values())),
        (3, sum(owed_totals.values())),
        (4, round(sum(net_balances.values()), 2)),
    ]:
        c = ws.cell(row=tr, column=col, value=round(val, 2))
        c.number_format = '£#,##0.00'; c.alignment = Alignment(horizontal="right")
        c.font = font(bold=True, color="FFFFFF")

    return ws


def build_settlement(wb, transactions):
    ws = wb.create_sheet("Settlement")
    ws.sheet_view.showGridLines = False

    for col, w in zip("ABCDEFG", [3, 5, 20, 8, 20, 14, 38]):
        ws.column_dimensions[col].width = w

    ws.merge_cells("B2:G2")
    c = ws["B2"]
    c.value = "Recommended Settlement Plan — Minimum Transactions"
    c.fill = fill("1F3864")
    c.font = Font(bold=True, color="FFFFFF", size=14, name="Calibri")
    c.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[2].height = 34

    ws.merge_cells("B3:G3")
    c = ws["B3"]
    c.value = f"{len(transactions)} payment(s) required to fully settle all debts"
    c.fill = fill("2F5496")
    c.font = Font(italic=True, color="FFFFFF", size=11, name="Calibri")
    c.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[3].height = 22

    for i, h in enumerate(["#", "Pays", "→", "To", "Amount (£)", "Bank ref"], 2):
        hdr(ws, 5, i, h, "2F5496")

    for tidx, (sender, receiver, amount) in enumerate(transactions, 1):
        r = tidx + 5
        bg = "F2F2F2" if tidx % 2 == 0 else "FFFFFF"
        ref = f"HF Weekend {sender}"
        for col, val in [(2, tidx), (3, sender), (4, "→"), (5, receiver), (6, amount), (7, ref)]:
            c = ws.cell(row=r, column=col, value=val)
            c.fill = fill(bg); c.border = BORDER
            if col == 4:
                c.alignment = Alignment(horizontal="center")
                c.font = Font(bold=True, size=14, color="2F5496", name="Calibri")
            elif col == 6:
                c.number_format = '£#,##0.00'
                c.alignment = Alignment(horizontal="right")
                c.font = font(bold=True)
            elif col in (3, 5):
                c.font = font(bold=True)
            elif col == 7:
                c.font = font(italic=True, color="666666")

    return ws


def build_whatsapp(wb, expenses, transactions, attendees):
    ws = wb.create_sheet("WhatsApp")
    ws.sheet_view.showGridLines = False
    ws.column_dimensions["A"].width = 3
    ws.column_dimensions["B"].width = 80

    total_spend = sum(e["amount"] for e in expenses)

    lines = [
        "─────────────────────────────────",
        "HF WEEKEND — EXPENSES & SETTLEMENT",
        "─────────────────────────────────",
        "",
        f"Total spend: £{total_spend:,.2f}  |  {len(attendees)} people",
        "",
        "Expenses:",
    ]
    for exp in expenses:
        lines.append(f"  {exp['date']}  {exp['description']:<22} £{exp['amount']:>8,.2f}  (paid by {exp['paid_by']})")
    lines += [
        "",
        "Split adjustments:",
        "  • Sat Drinks: Klaus had a small share (~1/3 of standard)",
        "  • Sun Breakfast: Klaus & Louise not present — split 14 ways",
        "",
        "Payments needed:",
    ]
    for sender, receiver, amount in transactions:
        lines.append(f"  {sender} pays {receiver}: £{amount:,.2f}")
    lines += [
        "",
        "Please pay by bank transfer.",
        "Use your name as the reference.",
        "─────────────────────────────────",
    ]

    hdr(ws, 1, 2, "WhatsApp Message  —  copy the yellow cell below and paste into your chat")
    ws.row_dimensions[1].height = 22

    for ridx, line in enumerate(lines, 2):
        c = ws.cell(row=ridx, column=2, value=line)
        c.font = Font(name="Courier New", size=10)
        c.alignment = Alignment(wrap_text=True, vertical="top")
        ws.row_dimensions[ridx].height = 16

    # Merged single-cell copy block
    block_start = len(lines) + 4
    block_end = block_start + 40
    ws.merge_cells(f"B{block_start}:B{block_end}")
    c = ws[f"B{block_start}"]
    c.value = "\n".join(lines)
    c.font = Font(name="Courier New", size=10)
    c.alignment = Alignment(wrap_text=True, vertical="top")
    c.fill = fill("FFFDE7")
    ws.row_dimensions[block_start].height = 20
    for r in range(block_start, block_end + 1):
        ws.row_dimensions[r].height = 15

    return ws


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("HF Weekend Expense Splitter")
    print("=" * 40)

    splits_matrix, paid_totals, owed_totals, net_balances = compute_splits(EXPENSES, ATTENDEES)
    transactions = simplify_debts(net_balances)

    total = sum(e["amount"] for e in EXPENSES)
    print(f"Attendees : {len(ATTENDEES)}")
    print(f"Expenses  : {len(EXPENSES)}  (total £{total:,.2f})")
    print(f"Settlement: {len(transactions)} transaction(s)\n")

    wb = openpyxl.Workbook()
    wb.remove(wb.active)

    build_overview(wb)
    build_attendees(wb, ATTENDEES)
    build_expenses(wb, EXPENSES)
    build_splits(wb, EXPENSES, ATTENDEES, splits_matrix)
    build_balances(wb, ATTENDEES, paid_totals, owed_totals, net_balances)
    build_settlement(wb, transactions)
    build_whatsapp(wb, EXPENSES, transactions, ATTENDEES)

    wb.save(OUTPUT_FILE)
    print(f"Saved: {OUTPUT_FILE}\n")

    print("Settlement plan:")
    for sender, receiver, amount in transactions:
        print(f"  {sender:<14} pays  {receiver:<14}  £{amount:,.2f}")
    print()
    print("Net balances:")
    for p in sorted(ATTENDEES, key=lambda x: net_balances[x], reverse=True):
        net = net_balances[p]
        arrow = "gets back" if net > 0 else "owes     "
        print(f"  {p:<14} {arrow}  £{abs(net):,.2f}")


if __name__ == "__main__":
    main()
