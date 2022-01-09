<template>
  <div>
    <!-- Tabs -->
    <q-tabs
      v-model="tab"
      align="left"
      dense
      class="q-mb-md text-blue-grey-7"
    >
      <q-tab :ripple="false" name="manual" label="Manual" />
      <q-tab :ripple="false" name="generator" label="Generator" />
    </q-tabs>
    <!-- Manual tab -->
    <div v-if="tab === 'manual'">
      <q-card
        :id="`q-color-scheme-${name}`"
        flat
        v-for="(color, name) in brandColors"
        :key="name"
        :color="name"
        :class="`col q-mb-sm q-pa-sm bg-${name} text-center text-${isDark(color) ? 'white' : 'black'} cursor-pointer`"
      >
        <q-popup-proxy transition-show="scale" transition-hide="scale">     
          <q-color
            v-model="brandColors[name]"
            no-header-tabs
            default-view="palette"
            :palette="palette"
          />
        </q-popup-proxy>
        {{ name }}
      </q-card>
    </div>
    <!-- Generator tab -->
    <div v-if="tab === 'generator'">
      <!-- Color picker -->
      <q-slider 
        v-model="hue" 
        :min="0" 
        :max="360"
        color="blue-grey-7"
        class="q-px-sm q-pt-lg"
        label
        label-always
        :label-value="`HUE ${hue}`"
      />
      <!-- Variation field -->
      <q-btn-group
        rounded
        spread
        class="q-mb-md"
      >
        <q-btn
          v-for="(name, key) in ['Default', 'Pastel']"
          :key="key"
          :color="variation === name ? 'blue-grey-7' : 'blue-grey-5'"
          :label="name"
          @click="variation = name"
        />
      </q-btn-group>
      <!-- Generated colors -->
      <q-card
        flat
        v-for="(color, key) in scheme"
        :key="key"
        :style="{
          backgroundColor: `#${color}`
        }"
        :class="`q-mb-sm q-pa-sm text-center text-${isDark(color) ? 'white' : 'black'} cursor-pointer`"
      >
        <!-- Generated colors menu -->
        <q-popup-proxy>
          <q-list
            style="min-width: 100px"
          >
            <q-item
              v-for="(c, name) in brandColors"
              :key="name"
              clickable 
              @click="setColor(name, `#${color}`)"
              v-close-popup
            >
              <q-item-section>Set as {{ name }} color</q-item-section>
            </q-item>
          </q-list>
        </q-popup-proxy>
        #{{ color }}
      </q-card>
    </div>
    <!-- Export button -->
    <div class="text-right q-mt-md">
      <q-btn 
        unelevated
        label="Export"
        color="blue-grey-7"
        @click="openExportDialog('scss')"
        :text-color="darkColors.accent ? 'white' : 'dark'"
      />
    </div>
    <!-- Export dialog -->
    <q-dialog v-model="exportDialog">
      <q-card>
        <q-card-section>
          <!-- Export dialog tags -->
          <q-tabs
            v-model="exportTab"
            align="left"
            dense
            class="text-blue-grey-7"
          >
            <q-tab 
              v-for="(name, key) in exportModes"
              :ripple="false" 
              :name="key" 
              :label="name" 
            />
          </q-tabs>
        </q-card-section>
        <!-- Code -->
        <q-card-section class="q-py-none">
          <code>
            <pre v-html="code(exportTab)" />
          </code>
        </q-card-section>
        <!-- Dialog actions-->
        <q-card-actions align="right" class="q-px-md">
          <q-btn flat label="Copy" color="blue-grey-7" :icon-right="copyIcon" @click="copy(code(exportTab))" />
          <q-btn flat label="Close" color="blue-grey-7" icon-right="close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { toRaw } from 'vue'
import { colors, copyToClipboard, getCssVar, setCssVar } from 'quasar'
import colorScheme from 'color-scheme'
const { brightness, getPaletteColor } = colors

export default {
  /**
   * Data
   */
  data() {
    return {
      // Quasar brand colors
      // see: https://quasar.dev/style/color-palette
      brandColors: {
        primary: '',
        secondary: '',
        accent: '',
        dark: '',
        positive: '',
        negative: '',
        info: '',
        warning: '',
      },
      // copy icon
      copyIcon: 'content_copy',
      // dark colors
      darkColors: {
        primary: true,
        secondary: true,
        accent: true,
        dark: true,
        positive: true,
        negative: true,
        info: true,
        warning: true,
      },
      // export dialog
      exportDialog: false,
      // export modes
      exportModes: {
        'sass': 'SASS',
        'scss': 'SCSS',
        'quasar-cli': 'Quasar CLI',
        'vite': 'Vite / UMD / Vue CLI',
      },
      // export tab 
      exportTab: 'sass',
      // hue
      hue: 0,
      // generated scheme
      scheme: [],
      // scheme variation
      // options: Default, Pastel, Soft, Light, Hard, Pale
      variation: 'Default',
      // selected tab
      tab: 'manual',
    }
  },
  /**
   * Computed
   */
  computed: {
    /**
     * Default colors palette containing dark colors
     * from Quasar defined colors
     * 
     * @see https://quasar.dev/style/color-palette
     */
    palette() {
      var colors = [
        'red',
        'pink',
        'purple',
        'deep-purple',
        'indigo',
        'blue',
        'light-blue',
        'cyan',
        'teal',
        'green',
        'light-green',
        'lime',
        'yellow',
        'amber',
        'orange',
        'deep-orange',
        'brown',
        'grey',
        'blue-grey',
      ]

      // return array of HEX colors 
      return colors.map(color => {
        return Array.from({length: 14}, (_, i) => i + 1)
          .map(i => {
            return `${color}-${i}`
          })
      })
      // convert array to flat 
      .flat()
      // convert color name to HEX
      .map(c => getPaletteColor(c))
      // skip light colors
      .filter(c => this.isDark(c))
    },
  },
  /**
   * Watch
   */
  watch: {
    /**
     * Set CSS color variables and calculate darkness 
     */
    brandColors: {
      deep: true,
      handler(colors) {
        // set colors variables
        Object.keys(toRaw(this.brandColors)).forEach(name => {
          setCssVar(name, colors[name])
        })
        // calculate darkness
        this.setDarkness()
      }
    },
    /**
     * Update generated colors 
     */
    hue() {
      this.setScheme()
    },
    /**
     * Update generated scheme
     */
    variation() {
      this.setScheme()
    }
  },
  /**
   * Methods
   */
  methods: {
    /**
     * Code
     */
    code(exportMode) {
      // SASS
      if (exportMode === 'sass') {
        var code = Object.keys(toRaw(this.brandColors))
          .map(name => {
            return `$${name}: ${this.brandColors[name]}`
          })
      }

      // SCSS
      if (exportMode === 'scss') {
        var code = Object.keys(toRaw(this.brandColors))
          .map(name => {
            return `$${name}: ${this.brandColors[name]};`
          })
      }

      // Quasar CLI 
      if (exportMode === 'quasar-cli') {
        var code = []
        code.push(`return {`)
        code.push(`  framework: {`)
        code.push(`    config: {`)
        code.push(`      brand: {`)

        var code = [...code, ...Object.keys(toRaw(this.brandColors))
          .map(name => {
            return `        ${name}: '${this.brandColors[name]}',`
          })]

        code.push(`      }`)
        code.push(`    }`)
        code.push(`  }`)
        code.push(`}`)
      }

      // Vite
      if (exportMode === 'vite') {
        var code = []
        code.push(`app.use(Quasar, {`)
        code.push(`  config: {`)
        code.push(`    brand: {`)

        var code = [...code, ...Object.keys(toRaw(this.brandColors))
          .map(name => {
            return `      ${name}: '${this.brandColors[name]}',`
          })]

        code.push(`    }`)
        code.push(`  }`)
        code.push(`}`)
      }

      return code.join("\n")
    },
    /**
     * Copy to the clipboard
     */
    copy(content) {
      // Quasar util: https://quasar.dev/quasar-utils/other-utils#copy-to-clipboard
      copyToClipboard(content)
        .then(() => {
          this.copyIcon = 'check_circle'
        })
        .catch(() => {
          this.copyIcon = 'remove_circle_outline'
        })
      setTimeout(() => {
        this.copyIcon = 'content_copy'
      }, 1000)
    },
    /**
     * Check if the color is dark
     */
    isDark(color) {
      return brightness(color) < 168
    },
    /**
     * Open export dialog
     */
    openExportDialog(exportTab) {
      // set tab
      this.exportTab = exportTab
      // show dialog
      this.exportDialog = true
    },
    /**
     * Color scheme
     */
    setScheme() {
      var scheme = new colorScheme
      this.scheme = scheme.from_hue(this.hue)
        .scheme('tetrade')
        .variation(toRaw(this.variation).toLowerCase())
        .colors()
        .filter(c => this.isDark(c))
    },
    /**
     * Set color
     */
    setColor(name, color) {
      this.brandColors[name] = color
    },
    /**
     * Set darkness
     */
    setDarkness() {
      Object.keys(toRaw(this.brandColors)).forEach(color => {
        this.darkColors[color] = this.isDark(getPaletteColor(color))
      })
      this.$emit('colors-changed', toRaw(this.darkColors))
    }
  },
  /**
   * Mounted
   */
  mounted() {
    Object.keys(toRaw(this.brandColors)).forEach(name => {
      this.brandColors[name] = getCssVar(name).toLowerCase()
    })
    this.setScheme()
    this.setDarkness()
  },
}
</script>