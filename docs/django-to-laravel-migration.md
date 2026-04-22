# Django → Laravel data migration plan (implementation-ready)

## Entity mapping

- Django `vendors_vendor` → Laravel `vendors`
- Django `products_product` → Laravel `products`
- Django `inventory_inventory` → Laravel `inventories`
- Django `sales_sale` → Laravel `sales` + `sale_items` (single-item Django rows become line items)
- Django `payments_payment` → Laravel `payments`

## Import pipeline design

1. Extract legacy data from Django SQLite/Postgres export.
2. Validate required fields and foreign keys before import.
3. Upsert by deterministic keys where possible:
   - vendors by normalized name + phone
   - products by normalized name + unit
4. Build inventory snapshots and seed opening stock movements.
5. Import sales and create corresponding stock-out movements.
6. Import payments and recompute `sales.paid_amount` + `sales.payment_status`.

## Idempotency rules

- Keep import batch id in a tracking table.
- Upsert records instead of blind inserts.
- Recompute derived totals (`total_amount`, `paid_amount`) on each run.

## Reconciliation outputs

- Record count comparison by table.
- Totals comparison:
  - gross sales
  - payments
  - due balance
- Missing relation report (orphan sales/payments).

## Cutover checklist

1. Run full import on staging from latest production snapshot.
2. Compare reconciliation report and fix mismatches.
3. Freeze writes on Django.
4. Run final import in production.
5. Verify dashboard totals and sample records.
6. Switch frontend/backend traffic to Laravel stack.
