<template>
  <q-page class="page-shell">
    <div class="page-content zone3-page">
      <header class="page-header">
        <div>
          <h1>Stock del día</h1>
          <p>Producto terminado recibido desde Zona 2, agrupado por marca comercial.</p>
        </div>
      </header>

      <section class="data-card zone3-card">
        <q-table
          v-if="dailyStockGroups.length"
          flat
          row-key="brand"
          :rows="dailyStockGroups"
          :columns="stockColumns"
          :pagination="{ rowsPerPage: 0 }"
          hide-pagination
          class="operation-table"
        >
          <template #body="props">
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
                ><strong>{{ number(props.row.boxes) }}</strong></q-td
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
                  ><strong>{{ number(product.boxes) }}</strong></q-td
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
                <q-td key="boxes" :props="props">{{ number(row.boxes) }}</q-td>
              </q-tr>
            </template>
          </template>
        </q-table>
        <div v-if="dailyStockGroups.length === 0" class="zone3-empty">
          <PackageCheck :size="36" />
          <strong>Sin stock producido hoy</strong>
          <span>Cierra una producción en Zona 2 para generar stock terminado.</span>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { ChevronRight, PackageCheck } from '@lucide/vue'
import { useZona3 } from './useZona3'
import './Zona3.css'

const { stockColumns, dailyStockGroups, number, isStockBrandOpen, toggleStockBrand } = useZona3()
</script>
