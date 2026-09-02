<template>
  <q-page class="page-shell">
    <div class="page-content zone3-page">
      <PageHeader title="Stock del día" description="Producto terminado recibido desde Zona 2, agrupado por marca comercial." />

      <ResponsiveDataTable
        class="zone3-card"
        row-key="brand"
        :rows="dailyStockGroups"
        :columns="stockColumns"
      >
          <template #desktop-body="props">
            <q-tr :props="props" class="stock-brand-row" @click="toggleStockBrand(props.row.brand)">
              <q-td key="brand" :props="props">
                <div class="client-cell">
                  <button
                    class="stock-expand-action"
                    type="button"
                    @click.stop="toggleStockBrand(props.row.brand)"
                  >
                    <ChevronRight :class="{ open: isStockBrandOpen(props.row.brand) }" :size="16" />
                  </button>
                  <span class="document-icon"><PackageCheck :size="18" /></span>
                  <div>
                    <strong>{{ props.row.brand }}</strong>
                  </div>
                </div>
              </q-td>
              <q-td key="product" :props="props"><strong>Todos</strong></q-td>
              <q-td key="caliber" :props="props"><strong>Total</strong></q-td>
              <q-td key="lot" :props="props">
                <span class="stock-summary-text">{{ props.row.lots.join(', ') }}</span>
              </q-td>
              <q-td key="boxes" :props="props"
                ><strong
                  >{{ number(props.row.available) }} / {{ number(props.row.boxes) }}</strong
                ></q-td
              >
            </q-tr>
            <template v-for="product in props.row.productGroups" :key="product.name">
              <q-tr
                v-show="isStockBrandOpen(props.row.brand)"
                :props="props"
                class="stock-product-row"
              >
                <q-td key="brand" :props="props"></q-td>
                <q-td key="product" :props="props"
                  ><strong>{{ product.name }}</strong></q-td
                >
                <q-td key="caliber" :props="props">Total producto</q-td>
                <q-td key="lot" :props="props">{{ product.lots.join(', ') }}</q-td>
                <q-td key="boxes" :props="props"
                  ><strong
                    >{{ number(product.available) }} / {{ number(product.boxes) }}</strong
                  ></q-td
                >
              </q-tr>
              <q-tr
                v-for="row in product.rows"
                v-show="isStockBrandOpen(props.row.brand)"
                :key="row.id"
                :props="props"
                class="stock-caliber-row"
              >
                <q-td key="brand" :props="props"></q-td>
                <q-td key="product" :props="props"></q-td>
                <q-td key="caliber" :props="props">Calibre {{ row.caliber }}</q-td>
                <q-td key="lot" :props="props">{{ row.lot }}</q-td>
                <q-td key="boxes" :props="props"
                  >{{ number(stockAvailable(row)) }} / {{ number(row.boxes) }}</q-td
                >
              </q-tr>
            </template>
          </template>
          <template #mobile><div class="stock-mobile-list lt-md">
          <article v-for="group in dailyStockGroups" :key="group.brand" class="stock-mobile-card">
            <button
              type="button"
              :aria-expanded="isStockBrandOpen(group.brand)"
              @click="toggleStockBrand(group.brand)"
            >
              <span class="document-icon"><PackageCheck :size="19" /></span>
              <span><strong>{{ group.brand }}</strong><small>{{ group.lots.length }} lote{{ group.lots.length === 1 ? '' : 's' }}</small></span>
              <span class="stock-mobile-total"><small>Disponible / producido</small><strong>{{ number(group.available) }} / {{ number(group.boxes) }}</strong></span>
              <ChevronRight :class="{ open: isStockBrandOpen(group.brand) }" :size="19" />
            </button>
            <div v-if="isStockBrandOpen(group.brand)" class="stock-mobile-products">
              <section v-for="product in group.productGroups" :key="product.name">
                <header><strong>{{ product.name }}</strong><span>{{ number(product.available) }} / {{ number(product.boxes) }} cajas</span></header>
                <dl>
                  <div v-for="row in product.rows" :key="row.id">
                    <dt>Calibre {{ row.caliber }} · Lote {{ row.lot }}</dt>
                    <dd>{{ number(stockAvailable(row)) }} / {{ number(row.boxes) }}</dd>
                  </div>
                </dl>
              </section>
            </div>
          </article>
          </div></template>
          <template #empty><div class="zone3-empty">
          <PackageCheck :size="36" />
          <strong>Sin stock producido hoy</strong>
          <span>Cierra una producción en Zona 2 para generar stock terminado.</span>
          </div></template>
      </ResponsiveDataTable>
    </div>
  </q-page>
</template>

<script setup>
import { ChevronRight, PackageCheck } from '@lucide/vue'
import PageHeader from '@/components/PageHeader.vue'
import ResponsiveDataTable from '@/components/ResponsiveDataTable.vue'
import { useZona3 } from '@/composables/useZona3'

const {
  stockColumns,
  dailyStockGroups,
  number,
  stockAvailable,
  isStockBrandOpen,
  toggleStockBrand,
} = useZona3()
</script>
