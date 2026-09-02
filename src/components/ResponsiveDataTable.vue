<template>
  <section class="data-card responsive-data-table">
    <template v-if="rows.length">
      <q-table
        flat
        :row-key="rowKey"
        :rows="rows"
        :columns="columns"
        :pagination="pagination"
        hide-pagination
        class="operation-table gt-sm"
      >
        <template v-if="$slots['desktop-body']" #body="props">
          <slot name="desktop-body" v-bind="props" />
        </template>
      </q-table>

      <slot v-if="$slots.mobile" name="mobile" :rows="rows" />
      <div v-else class="responsive-card-list lt-md">
        <article
          v-for="(row, index) in rows"
          :key="rowKeyValue(row, index)"
          :class="['responsive-data-card', { 'responsive-data-card--clickable': clickable }]"
          :role="clickable ? 'button' : undefined"
          :tabindex="clickable ? 0 : undefined"
          @click="selectRow(row)"
          @keydown.enter.prevent="selectRow(row)"
          @keydown.space.prevent="selectRow(row)"
        >
          <header class="responsive-data-card__header">
            <div class="responsive-data-card__identity">
              <slot v-if="$slots['mobile-leading']" name="mobile-leading" :row="row" />
              <div>
                <strong><slot name="mobile-title" :row="row" /></strong>
                <small v-if="$slots['mobile-subtitle']">
                  <slot name="mobile-subtitle" :row="row" />
                </small>
              </div>
            </div>
            <slot v-if="$slots['mobile-status']" name="mobile-status" :row="row" />
          </header>

          <dl v-if="mobileFields.length" class="responsive-data-card__fields">
            <div v-for="field in mobileFields" :key="field.label">
              <dt>{{ field.label }}</dt>
              <dd>{{ field.value(row) }}</dd>
            </div>
          </dl>

          <footer v-if="$slots['mobile-actions']" class="responsive-data-card__actions" @click.stop>
            <slot name="mobile-actions" :row="row" />
          </footer>
        </article>
      </div>
    </template>
    <slot v-else name="empty" />
  </section>
</template>

<script setup>
const emit = defineEmits(['select'])
const props = defineProps({
  rows: { type: Array, required: true },
  columns: { type: Array, required: true },
  rowKey: { type: [String, Function], default: 'id' },
  mobileFields: { type: Array, default: () => [] },
  clickable: { type: Boolean, default: false },
})

const pagination = { rowsPerPage: 0 }

function rowKeyValue(row, index) {
  return typeof props.rowKey === 'function' ? props.rowKey(row) : (row[props.rowKey] ?? index)
}

function selectRow(row) {
  if (props.clickable) emit('select', row)
}
</script>

<style scoped lang="scss">
.responsive-data-table {
  margin-top: 18px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fff;
}

.responsive-card-list {
  display: grid;
  gap: 10px;
  padding: 12px;
}

.responsive-data-card {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #fff;
}

.responsive-data-card--clickable {
  cursor: pointer;
}

.responsive-data-card--clickable:focus-visible {
  outline: 3px solid rgb(239 61 53 / 24%);
  outline-offset: 2px;
}

.responsive-data-card__header,
.responsive-data-card__identity {
  display: flex;
  gap: 10px;
  align-items: center;
}

.responsive-data-card__header {
  justify-content: space-between;
}

.responsive-data-card__identity {
  min-width: 0;
}

.responsive-data-card__identity > div {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.responsive-data-card__identity strong {
  overflow-wrap: anywhere;
  font-size: 14px;
}

.responsive-data-card__identity small {
  color: var(--muted);
  font-size: 12px;
}

.responsive-data-card__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 14px;
  margin: 14px 0 0;
  padding: 12px;
  border-radius: 11px;
  background: #f7f7f6;
}

.responsive-data-card__fields div {
  min-width: 0;
}

.responsive-data-card__fields dt {
  color: var(--muted);
  font-size: 11px;
}

.responsive-data-card__fields dd {
  margin: 3px 0 0;
  overflow-wrap: anywhere;
  font-size: 13px;
  font-weight: 650;
}

.responsive-data-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

.responsive-data-card__actions button {
  display: inline-flex;
  flex: 1 1 auto;
  gap: 6px;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 0 11px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #fff;
  color: var(--ink);
  font-size: 12px;
  font-weight: 650;
}

.responsive-data-card__actions button.danger {
  color: var(--brand-dark);
}

.responsive-data-card__actions button:disabled {
  opacity: 0.35;
}

@media (max-width: 1023px) {
  .responsive-data-table {
    overflow: visible;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .responsive-card-list,
  .responsive-data-table :deep(.stock-mobile-list) {
    padding: 0;
  }

  .responsive-data-card__fields {
    padding: 12px 0 0;
    border-top: 1px solid var(--line);
    border-radius: 0;
    background: transparent;
  }
}
</style>
