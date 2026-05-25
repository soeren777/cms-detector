// cms-detector.js - v4
// Stufe 1: Option 8 (CDN-Domain-Signals) + Option 10 (neue CMS-Signaturen)
// Stufe 2: Option 6 (DNS/CNAME-Check für SaaS-Systeme)
// Stufe 3: Option 9 (erweiterte Versionserkennung)

const https    = require('https');
const http     = require('http');
const crypto   = require('crypto');
const dns      = require('dns').promises;
const { URL: URLParser } = require('url');

class CMSDetector {
  constructor() {

    // ═══════════════════════════════════════════════════════════════════════
    // STUFE 1A – CDN-Domain-Signals (Option 8)
    // Bekannte CDN/Asset-Domains die exklusiv einem CMS zugeordnet sind.
    // Wird gegen alle externen URLs im HTML abgeglichen (src, href, url()).
    // ═══════════════════════════════════════════════════════════════════════
    this.cdnSignals = {
      wordpress:    ['wp-content.', 'wp-includes.'],
      shopify:      ['cdn.shopify.com', 'cdn.shopifycloud.com', 'shopifycloud.com'],
      wix:          ['static.wixstatic.com', 'static.parastorage.com', 'video.wixstatic.com'],
      squarespace:  ['static1.squarespace.com', 'images.squarespace-cdn.com', 'sqspcdn.com'],
      webflow:      ['assets.website-files.com', 'uploads-ssl.webflow.com', 'd3e54v103j8qbb.cloudfront.net'],
      ghost:        ['cdn.jsdelivr.net/ghost', 'img.spacergif.org'],
      storyblok:    ['a.storyblok.com', 'img2.storyblok.com'],
      contentful:   ['images.ctfassets.net', 'assets.ctfassets.net', 'downloads.ctfassets.net'],
      builderio:    ['cdn.builder.io', 'cdn-cgi.builder.io'],
      strapi:       ['strapi.io/uploads'],
      prestashop:   ['prestashop.com', 'modules.prestashop.com'],
      opencart:     ['opencart.com/index'],
      hubspotcms:   ['hs-scripts.com', 'hubspot.com/hs/', 'hscollectedforms.net', 'hs-analytics.net'],
      weebly:       ['editmysite.com', 'weebly.com/uploads', 'edgefonts.net'],
      framer:       ['framer.com/m/', 'framerusercontent.com'],
      sanity:       ['cdn.sanity.io'],
      prismic:      ['prismic.io', 'cdn.prismic.io'],
      netlify:      ['netlify.app', 'netlify.com'],
      vercel:       ['vercel.app', '_vercel.'],
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STUFE 2 – DNS/CNAME-Fingerprints (Option 6)
    // SaaS-Systeme haben charakteristische CNAME-Ziele oder A-Record-Ranges.
    // Ein CNAME-Match ist ein sehr starkes Signal (Gewicht 70).
    // ═══════════════════════════════════════════════════════════════════════
    this.dnsFingerprints = {
      // CNAME-Ziele (substring-match gegen den aufgelösten CNAME)
      shopify:      { cname: ['myshopify.com', 'shopify.com'] },
      wix:          { cname: ['wixdns.net', 'wix.com'] },
      squarespace:  { cname: ['squarespace.com', 'sqsp.net'] },
      webflow:      { cname: ['proxy.webflow.com', 'webflow.io'] },
      ghost:        { cname: ['ghost.io', 'ghost.org'] },
      jimdo:        { cname: ['jimdo.com', 'jimdofree.com'] },
      hubspotcms:   { cname: ['hubspot.com', 'hs-sites.com'] },
      weebly:       { cname: ['weebly.com', 'editmysite.com'] },
      netlify:      { cname: ['netlify.com', 'netlify.app'] },
      vercel:       { cname: ['vercel.app', 'vercel-dns.com'] },
      framer:       { cname: ['framer.app', 'framerusercontent.com'] },
      wordpress:    { cname: ['wordpress.com', 'wpcomstaging.com'] },
      storyblok:    { cname: ['storyblok.com'] },
      // A-Record Ranges (CIDR-Prefix, nur für sehr spezifische Hosters)
      // Hier bewusst leer gelassen – zu fehleranfällig bei CDN-Nutzung
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STUFE 1B – Erweiterte CMS-Signaturen (Option 10)
    // Neue CMS: Storyblok, Contentful, Sanity, Strapi, PrestaShop,
    // HubSpot CMS, Weebly, Framer, OXID eSales, Hugo, Jekyll, Eleventy,
    // Builder.io, Prismic, OpenCart, Sitecore
    // ═══════════════════════════════════════════════════════════════════════
    this.signatures = {

      // ─── Major Open Source CMS ──────────────────────────────────────────
      wordpress: {
        paths:     ['/wp-login.php', '/wp-json/', '/wp-cron.php'],
        headers:   ['x-powered-by-wp', 'x-wp-nonce'],
        poweredBy: ['WordPress'],
        meta:      ['WordPress'],
        html:      ['/wp-content/', '/wp-includes/', 'wp-json', 'wp-embed.min.js', 'wp-block-library'],
        scripts:   ['wp-includes/js/', 'wp-content/themes/', 'wp-content/plugins/'],
        links:     ['wp-content/themes/'],
        cookies:   ['wordpress_logged_in', 'wp-settings-', 'wordpress_test_cookie'],
        jsVars:    ['wpApiSettings', 'wp_ajax_url', 'woocommerce_params'],
        htmlAttrs: ['class="wp-', 'data-wp-', 'class="wordpress'],
        robots:    ['/wp-content/', '/wp-includes/', 'wp-login.php'],
        feed:      ['wordpress.org'],
        errorPage: ['wp-login.php', '/wp-content/'],
        faviconHashes: [],
        versionPatterns: [
          { regex: /\/wp-includes\/[^"']+\?ver=([\d.]+)/i, label: 'Script ver param' },
          { regex: /<meta[^>]*generator[^>]*WordPress ([\d.]+)/i, label: 'Meta generator' },
        ],
        negates:   ['joomla', 'drupal']
      },

      joomla: {
        paths:     ['/administrator/index.php', '/media/jui/js/'],
        headers:   [],
        poweredBy: [],
        meta:      ['Joomla'],
        html:      ['/media/jui/js/', '/media/system/js/', 'option=com_', 'Joomla.JText', '/templates/'],
        scripts:   ['/media/jui/', '/media/system/'],
        links:     ['/templates/'],
        cookies:   [],
        jsVars:    ['Joomla', 'JText'],
        htmlAttrs: ['xmlns:joomla', 'data-joomla'],
        robots:    ['/administrator/', '/components/', '/modules/', 'joomla'],
        feed:      ['joomla'],
        errorPage: ['/administrator/', 'Joomla'],
        faviconHashes: [],
        versionPatterns: [
          { regex: /<meta[^>]*generator[^>]*Joomla! ([\d.]+)/i, label: 'Meta generator' },
        ],
        negates:   ['wordpress', 'drupal']
      },

      drupal: {
        paths:     ['/core/misc/drupal.js', '/sites/default/files/'],
        headers:   ['x-drupal-cache', 'x-drupal-dynamic-cache'],
        poweredBy: [],
        meta:      ['Drupal'],
        html:      ['Drupal.settings', '/sites/default/files/', 'drupal.js', '/core/themes/', '/core/misc/'],
        scripts:   ['/core/misc/', '/sites/all/modules/'],
        links:     ['/core/themes/', '/sites/all/themes/'],
        cookies:   ['SSESS', 'SESS'],
        jsVars:    ['drupalSettings', 'Drupal.behaviors'],
        htmlAttrs: ['data-drupal-', 'class="drupal-'],
        robots:    ['/core/', '/sites/default/', '/modules/'],
        feed:      ['drupal'],
        errorPage: ['drupal', '/core/'],
        faviconHashes: [],
        versionPatterns: [
          { regex: /Drupal ([\d.]+)/i, label: 'Drupal version string' },
        ],
        negates:   ['wordpress', 'joomla']
      },

      typo3: {
        paths:     ['/typo3conf/ext/', '/typo3/index.php'],
        headers:   [],
        poweredBy: ['TYPO3'],
        meta:      ['TYPO3'],
        html:      ['typo3conf', 'typo3temp', 'TYPO3.settings', '/typo3/sysext/'],
        scripts:   ['/typo3conf/', '/typo3/'],
        links:     ['/typo3conf/'],
        cookies:   ['fe_typo_user', 'be_typo_user'],
        jsVars:    ['TYPO3', 'T3FluidJs'],
        htmlAttrs: ['data-typo3-', 'class="typo3-'],
        robots:    ['/typo3/', '/typo3conf/', '/typo3temp/'],
        feed:      ['typo3'],
        errorPage: ['TYPO3', 'typo3conf'],
        faviconHashes: [],
        versionPatterns: [
          { regex: /TYPO3 CMS ([\d.]+)/i, label: 'TYPO3 version string' },
        ],
        negates:   []
      },

      contao: {
        paths:     ['/contao/login', '/system/modules/'],
        headers:   [],
        poweredBy: [],
        meta:      ['Contao'],
        html:      ['system/modules/core', 'contao.js', 'TL_MODE', '/contao/'],
        scripts:   ['/assets/contao/'],
        links:     [],
        cookies:   ['contao_', 'csrf_contao'],
        jsVars:    ['Contao'],
        htmlAttrs: [],
        robots:    ['/system/', '/contao/'],
        feed:      ['contao'],
        errorPage: ['Contao'],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      // ─── E-Commerce ─────────────────────────────────────────────────────
      shopify: {
        paths:     [],
        headers:   ['x-shopify-stage', 'x-shopid', 'x-shopify-request-id'],
        poweredBy: ['Shopify'],
        meta:      ['Shopify'],
        html:      ['cdn.shopify.com', 'Shopify.theme', 'shopify-section', 'myshopify.com'],
        scripts:   ['cdn.shopify.com/s/files/'],
        links:     ['cdn.shopify.com'],
        cookies:   ['_shopify_s', '_shopify_y', 'cart_sig'],
        jsVars:    ['Shopify', 'ShopifyAnalytics'],
        htmlAttrs: ['data-shopify', 'class="shopify-'],
        robots:    ['cdn.shopify.com', 'myshopify.com'],
        feed:      ['shopify'],
        errorPage: ['shopify', 'cdn.shopify.com'],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      magento: {
        paths:     ['/skin/frontend/', '/js/mage/'],
        headers:   ['x-magento-cache-debug', 'x-magento-tags'],
        poweredBy: ['Magento'],
        meta:      ['Magento'],
        html:      ['Mage.Cookies', '/skin/frontend/default/', '/js/mage/', 'var BLANK_URL', 'Magento_Ui'],
        scripts:   ['/js/mage/', '/skin/frontend/'],
        links:     [],
        cookies:   ['frontend', 'PHPSESSID'],
        jsVars:    ['Mage', 'Magento_Ui/js/'],
        htmlAttrs: [],
        robots:    ['/downloader/', '/pkginfo/', '/skin/'],
        feed:      ['magento'],
        errorPage: ['Magento', '/js/mage/'],
        faviconHashes: [],
        versionPatterns: [
          { regex: /Magento\/([\d.]+)/i, label: 'Magento version header' },
        ],
        negates:   []
      },

      woocommerce: {
        paths:     ['/wp-json/wc/'],
        headers:   [],
        poweredBy: [],
        meta:      [],
        html:      ['woocommerce', 'wc-blocks-', 'add_to_cart', 'wc_cart_hash'],
        scripts:   ['woocommerce/assets/', 'wc-add-to-cart'],
        links:     [],
        cookies:   ['woocommerce_cart_hash', 'woocommerce_items_in_cart'],
        jsVars:    ['woocommerce_params', 'wc_cart_fragments_params'],
        htmlAttrs: ['class="woocommerce'],
        robots:    ['/wp-content/plugins/woocommerce/'],
        feed:      [],
        errorPage: [],
        faviconHashes: [],
        versionPatterns: [
          { regex: /woocommerce\/([\d.]+)/i, label: 'WooCommerce script ver' },
        ],
        negates:   []
      },

      prestashop: {
        paths:     ['/admin/', '/modules/'],
        headers:   [],
        poweredBy: ['PrestaShop'],
        meta:      ['PrestaShop'],
        html:      ['prestashop', 'id="prestashop', '/modules/blockcart/', 'id_product'],
        scripts:   ['/themes/classic/', '/js/jquery/plugins/'],
        links:     ['/themes/classic/'],
        cookies:   ['PrestaShop-', 'id_cart'],
        jsVars:    ['prestashop', 'Prestashop'],
        htmlAttrs: ['class="prestashop-', 'itemtype="http://schema.org/Product"'],
        robots:    ['/modules/', '/themes/', '/upload/'],
        feed:      ['PrestaShop'],
        errorPage: ['PrestaShop'],
        faviconHashes: [],
        versionPatterns: [
          { regex: /PrestaShop ([\d.]+)/i, label: 'PrestaShop version string' },
        ],
        negates:   []
      },

      opencart: {
        paths:     ['/admin/index.php', '/catalog/view/'],
        headers:   [],
        poweredBy: ['OpenCart'],
        meta:      ['OpenCart'],
        html:      ['route=product', 'opencart', 'catalog/view/theme', 'token='],
        scripts:   ['/catalog/view/javascript/'],
        links:     ['/catalog/view/theme/'],
        cookies:   ['OCSESSID', 'currency'],
        jsVars:    ['opencart'],
        htmlAttrs: [],
        robots:    ['/catalog/', '/admin/'],
        feed:      [],
        errorPage: ['OpenCart'],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      oxid: {
        paths:     ['/admin/index.php'],
        headers:   [],
        poweredBy: [],
        meta:      ['OXID eShop'],
        html:      ['oxid', 'cl=alist', 'cl=details', 'oxideshop', 'tpl=widget'],
        scripts:   [],
        links:     [],
        cookies:   ['sid_key', 'oxid_'],
        jsVars:    [],
        htmlAttrs: [],
        robots:    ['cl=alist'],
        feed:      [],
        errorPage: ['OXID'],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      // ─── SaaS / Hosted Website Builders ─────────────────────────────────
      wix: {
        paths:     [],
        headers:   ['x-wix-request-id', 'x-wix-renderer-server', 'x-wix-published-version'],
        poweredBy: ['Wix'],
        meta:      ['Wix.com'],
        html:      ['static.parastorage.com', 'static.wixstatic.com', '_wix_browser_sess', 'wixBiSession'],
        scripts:   ['static.parastorage.com/', 'static.wixstatic.com/'],
        links:     ['static.wixstatic.com'],
        cookies:   ['_wixCIDX', '_wix_browser_sess'],
        jsVars:    ['wixBiSession', 'wixPerformanceMeasurements'],
        htmlAttrs: ['data-site-id', 'id="SITE_CONTAINER"'],
        robots:    ['wixstatic.com', 'parastorage.com'],
        feed:      ['wix.com'],
        errorPage: ['wix.com', 'wixstatic.com'],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      squarespace: {
        paths:     [],
        headers:   ['x-servedby'],
        poweredBy: ['Squarespace'],
        meta:      ['Squarespace'],
        html:      ['static1.squarespace.com', 'squarespace.com/commerce', 'Static.SQUARESPACE_CONTEXT', 'ss-canvas'],
        scripts:   ['static1.squarespace.com/', 'sqspcdn.com/'],
        links:     ['static1.squarespace.com'],
        cookies:   ['crumb', 'ss-cvr', 'ss-cid'],
        jsVars:    ['Static.SQUARESPACE_CONTEXT', 'Squarespace'],
        htmlAttrs: ['data-controller="squarespace"', 'class="sqs-'],
        robots:    ['squarespace.com', 'sqspcdn.com'],
        feed:      ['squarespace'],
        errorPage: ['squarespace'],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      webflow: {
        paths:     [],
        headers:   ['x-wf-site'],
        poweredBy: ['Webflow'],
        meta:      ['Webflow'],
        html:      ['webflow.com/css/', 'assets.website-files.com', 'uploads-ssl.webflow.com', 'w-webflow-badge'],
        scripts:   ['assets.website-files.com/', 'd3e54v103j8qbb.cloudfront.net/'],
        links:     ['webflow.com/css/'],
        cookies:   [],
        jsVars:    ['Webflow'],
        htmlAttrs: ['data-wf-site', 'data-wf-page', 'class="w-'],
        robots:    ['webflow.io', 'website-files.com'],
        feed:      [],
        errorPage: ['webflow'],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      ghost: {
        paths:     ['/ghost/', '/content/themes/'],
        headers:   ['x-ghost-cache-status'],
        poweredBy: ['Ghost'],
        meta:      ['Ghost'],
        html:      ['ghost.io', '/content/themes/', 'ghost/api/', 'tryghost.org'],
        scripts:   ['/assets/built/', 'cdn.jsdelivr.net/ghost/'],
        links:     ['/assets/'],
        cookies:   ['ghost-members-ssr'],
        jsVars:    ['ghost', 'GhostContentAPI'],
        htmlAttrs: ['data-ghost', 'class="gh-'],
        robots:    ['/ghost/', 'ghost.io'],
        feed:      ['ghost', 'Ghost'],
        errorPage: ['ghost'],
        faviconHashes: [],
        versionPatterns: [
          { regex: /ghost\/([\d.]+)/i, label: 'Ghost version string' },
        ],
        negates:   []
      },

      jimdo: {
        paths:     [],
        headers:   ['x-jimdo-instance', 'x-jimdo-wid'],
        poweredBy: ['Jimdo'],
        meta:      ['Jimdo'],
        html:      ['jimdo.com', 'jimdofree.com', 'jimdo-website-creator'],
        scripts:   ['jimdo.com/'],
        links:     [],
        cookies:   ['jimdo_'],
        jsVars:    ['jimdo'],
        htmlAttrs: [],
        robots:    ['jimdo.com'],
        feed:      [],
        errorPage: ['jimdo'],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      sitejet: {
        paths:     [],
        headers:   ['x-sitejet'],
        poweredBy: [],
        meta:      ['SiteJet', 'Sitejet'],
        html:      ['sitejet.io', 'sitejet-builder'],
        scripts:   ['sitejet.io/'],
        links:     [],
        cookies:   [],
        jsVars:    [],
        htmlAttrs: [],
        robots:    ['sitejet.io'],
        feed:      [],
        errorPage: [],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      hubspotcms: {
        paths:     ['/hs/hsstatic/', '/_hcms/'],
        headers:   ['x-hs-cf-stack', 'x-hubspot-correlation-id'],
        poweredBy: ['HubSpot'],
        meta:      ['HubSpot'],
        html:      ['hs-scripts.com', 'hubspot.com/hs/', 'hscollectedforms.net', 'hsforms.com', '_hsp'],
        scripts:   ['hs-scripts.com/', 'hsforms.net/', 'hscollectedforms.net/'],
        links:     [],
        cookies:   ['hubspotutk', '__hstc', '__hssc'],
        jsVars:    ['hbspt', '_hsq', 'HubSpot'],
        htmlAttrs: ['data-hs-', 'class="hs-'],
        robots:    ['/hs/', '/_hcms/'],
        feed:      ['HubSpot'],
        errorPage: ['hubspot'],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      weebly: {
        paths:     [],
        headers:   ['x-weebly-publishtime'],
        poweredBy: ['Weebly'],
        meta:      ['Weebly'],
        html:      ['editmysite.com', 'weebly.com/uploads', 'weeblycloud.com', 'data-widget-type'],
        scripts:   ['edgefonts.net/', 'weebly.com/'],
        links:     [],
        cookies:   ['weebly_cookie', 'weebly_'],
        jsVars:    ['Weebly'],
        htmlAttrs: ['data-widget-type', 'class="wsite-'],
        robots:    ['weebly.com'],
        feed:      [],
        errorPage: ['weebly'],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      framer: {
        paths:     [],
        headers:   ['x-framer-host'],
        poweredBy: ['Framer'],
        meta:      ['Framer'],
        html:      ['framerusercontent.com', 'framer.com/m/', '__framer_'],
        scripts:   ['framerusercontent.com/', 'framer.com/m/'],
        links:     ['framerusercontent.com'],
        cookies:   [],
        jsVars:    ['__framer_importmap', 'FramerBridge'],
        htmlAttrs: ['data-framer-', 'class="framer-'],
        robots:    ['framerusercontent.com'],
        feed:      [],
        errorPage: ['framer'],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      // ─── Headless / API-First CMS ────────────────────────────────────────
      storyblok: {
        paths:     [],
        headers:   ['x-storyblok-'],
        poweredBy: [],
        meta:      ['Storyblok'],
        html:      ['a.storyblok.com', 'img2.storyblok.com', 'storyblok.com'],
        scripts:   ['a.storyblok.com/'],
        links:     [],
        cookies:   [],
        jsVars:    ['StoryblokBridge', 'useStoryblokApi'],
        htmlAttrs: ['data-blok-', 'data-storyblok'],
        robots:    ['storyblok.com'],
        feed:      [],
        errorPage: [],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      contentful: {
        paths:     [],
        headers:   [],
        poweredBy: [],
        meta:      ['Contentful'],
        html:      ['images.ctfassets.net', 'assets.ctfassets.net', 'downloads.ctfassets.net', 'ctfassets.net'],
        scripts:   ['ctfassets.net/'],
        links:     ['ctfassets.net'],
        cookies:   [],
        jsVars:    ['contentfulClient', '__CONTENTFUL_'],
        htmlAttrs: ['data-contentful-'],
        robots:    ['ctfassets.net'],
        feed:      [],
        errorPage: [],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      sanity: {
        paths:     ['/studio/', '/sanity-studio/'],
        headers:   [],
        poweredBy: [],
        meta:      ['Sanity'],
        html:      ['cdn.sanity.io', 'sanity.io', 'sanityClient'],
        scripts:   ['cdn.sanity.io/'],
        links:     [],
        cookies:   [],
        jsVars:    ['sanityClient', '__SANITY_', 'SanityClient'],
        htmlAttrs: ['data-sanity-'],
        robots:    ['cdn.sanity.io'],
        feed:      [],
        errorPage: [],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      strapi: {
        paths:     ['/admin/', '/api/'],
        headers:   ['x-powered-by'],
        poweredBy: ['Strapi'],
        meta:      ['Strapi'],
        html:      ['strapi.io', '/uploads/', 'strapi'],
        scripts:   [],
        links:     [],
        cookies:   [],
        jsVars:    ['strapi', 'Strapi'],
        htmlAttrs: [],
        robots:    ['/uploads/'],
        feed:      [],
        errorPage: ['Strapi'],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      builderio: {
        paths:     [],
        headers:   [],
        poweredBy: [],
        meta:      ['Builder.io'],
        html:      ['cdn.builder.io', 'builder.io', 'builderio'],
        scripts:   ['cdn.builder.io/'],
        links:     [],
        cookies:   [],
        jsVars:    ['BuilderComponent', '__BUILDER_CONTENT_', 'builder.init'],
        htmlAttrs: ['builder-model', 'data-builder-'],
        robots:    ['cdn.builder.io'],
        feed:      [],
        errorPage: [],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      prismic: {
        paths:     [],
        headers:   [],
        poweredBy: [],
        meta:      ['Prismic'],
        html:      ['prismic.io', 'cdn.prismic.io', 'prismicio'],
        scripts:   ['cdn.prismic.io/', 'prismic.io/'],
        links:     [],
        cookies:   ['io.prismic.preview'],
        jsVars:    ['Prismic', 'prismic'],
        htmlAttrs: ['data-oembed-provider="Prismic"'],
        robots:    ['cdn.prismic.io'],
        feed:      [],
        errorPage: [],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      // ─── Static Site Generators ─────────────────────────────────────────
      hugo: {
        paths:     [],
        headers:   [],
        poweredBy: [],
        meta:      ['Hugo'],
        html:      ['Hugo', 'gohugo.io'],
        scripts:   [],
        links:     [],
        cookies:   [],
        jsVars:    [],
        htmlAttrs: [],
        robots:    [],
        feed:      ['Hugo', 'gohugo.io'],
        errorPage: [],
        faviconHashes: [],
        versionPatterns: [
          { regex: /Hugo ([\d.]+)/i, label: 'Hugo version string' },
        ],
        negates:   ['wordpress', 'joomla', 'drupal']
      },

      jekyll: {
        paths:     [],
        headers:   [],
        poweredBy: [],
        meta:      ['Jekyll'],
        html:      ['jekyll', 'jekyllrb.com', '/assets/main.css'],
        scripts:   [],
        links:     ['/assets/main.css'],
        cookies:   [],
        jsVars:    [],
        htmlAttrs: [],
        robots:    [],
        feed:      ['Jekyll'],
        errorPage: [],
        faviconHashes: [],
        versionPatterns: [
          { regex: /Jekyll v?([\d.]+)/i, label: 'Jekyll version string' },
        ],
        negates:   ['wordpress', 'joomla', 'drupal']
      },

      eleventy: {
        paths:     [],
        headers:   [],
        poweredBy: [],
        meta:      ['Eleventy'],
        html:      ['11ty', 'eleventy', '11ty.dev'],
        scripts:   [],
        links:     [],
        cookies:   [],
        jsVars:    [],
        htmlAttrs: [],
        robots:    [],
        feed:      ['Eleventy', '11ty'],
        errorPage: [],
        faviconHashes: [],
        versionPatterns: [],
        negates:   ['wordpress', 'joomla', 'drupal']
      },

      // ─── Forums & Community ──────────────────────────────────────────────
      woltlab: {
        paths:     ['/index.php?form=Login'],
        headers:   [],
        poweredBy: ['WoltLab'],
        meta:      ['WoltLab'],
        html:      ['WCF.Language', 'woltlab.com', 'wcfacp', '/wcf/'],
        scripts:   ['/wcf/js/', '/wcf/style/'],
        links:     ['/wcf/'],
        cookies:   ['wsc_', 'wcf_cookieHash'],
        jsVars:    ['WCF', 'WoltLab'],
        htmlAttrs: ['id="pageContainer"', 'data-wcf-'],
        robots:    ['/wcf/', 'woltlab'],
        feed:      ['woltlab'],
        errorPage: ['WCF', 'woltlab'],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      phpbb: {
        paths:     ['/ucp.php', '/viewforum.php'],
        headers:   [],
        poweredBy: ['phpBB'],
        meta:      ['phpBB'],
        html:      ['phpbb', 'powered by phpBB', 'phpBB Group', 'viewtopic.php'],
        scripts:   [],
        links:     [],
        cookies:   ['phpbb3_', 'phpbb_'],
        jsVars:    ['phpbb'],
        htmlAttrs: [],
        robots:    ['phpBB', '/phpbb/'],
        feed:      ['phpBB'],
        errorPage: ['phpBB'],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      // ─── Modern / Headless Frameworks ────────────────────────────────────
      nextjs: {
        paths:     ['/_next/static/'],
        headers:   ['x-nextjs-cache', 'x-nextjs-page', 'x-next-cache-tags'],
        poweredBy: [],
        meta:      [],
        html:      ['__NEXT_DATA__', '_next/static/', '__next', '__NEXT_LOADED_PAGES__'],
        scripts:   ['/_next/static/'],
        links:     [],
        cookies:   ['__next_preview_data'],
        jsVars:    ['__NEXT_DATA__', 'next'],
        htmlAttrs: ['id="__next"'],
        robots:    ['/_next/'],
        feed:      [],
        errorPage: ['__next', '_next/static/'],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      nuxtjs: {
        paths:     ['/_nuxt/'],
        headers:   ['x-nuxt-prerender'],
        poweredBy: [],
        meta:      [],
        html:      ['__NUXT__', '/_nuxt/', 'nuxt-link', 'data-n-head'],
        scripts:   ['/_nuxt/'],
        links:     ['/_nuxt/'],
        cookies:   [],
        jsVars:    ['__NUXT__', '$nuxt'],
        htmlAttrs: ['id="__nuxt"', 'id="__layout"'],
        robots:    ['/_nuxt/'],
        feed:      [],
        errorPage: ['__nuxt', '/_nuxt/'],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      gatsby: {
        paths:     ['/page-data/'],
        headers:   [],
        poweredBy: [],
        meta:      [],
        html:      ['___gatsby', 'gatsby-', '/page-data/', 'gatsby-image', 'data-gatsby-'],
        scripts:   ['/commons-', '/webpack-runtime-'],
        links:     [],
        cookies:   [],
        jsVars:    ['___gatsby', '__gatsby'],
        htmlAttrs: ['id="___gatsby"'],
        robots:    ['/page-data/'],
        feed:      [],
        errorPage: ['gatsby'],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      // ─── PHP Frameworks ──────────────────────────────────────────────────
      laravel: {
        paths:     [],
        headers:   [],
        poweredBy: [],
        meta:      [],
        html:      ['csrf-token', 'laravel_session', 'window.Laravel', '/vendor/laravel/'],
        scripts:   [],
        links:     [],
        cookies:   ['laravel_session', 'XSRF-TOKEN'],
        jsVars:    ['window.Laravel', 'csrfToken'],
        htmlAttrs: [],
        robots:    ['/vendor/laravel/'],
        feed:      [],
        errorPage: ['laravel', 'Whoops', 'Illuminate\\'],
        faviconHashes: [],
        versionPatterns: [
          { regex: /Laravel v?([\d.]+)/i, label: 'Laravel version string' },
        ],
        negates:   []
      },

      symfony: {
        paths:     ['/_profiler/', '/_wdt/'],
        headers:   ['x-debug-token', 'x-debug-token-link'],
        poweredBy: [],
        meta:      [],
        html:      ['sf-toolbar', 'symfony/web-profiler-bundle', 'Symfony\\'],
        scripts:   [],
        links:     [],
        cookies:   ['PHPSESSID', 'sf_redirect'],
        jsVars:    ['Symfony'],
        htmlAttrs: [],
        robots:    ['/_profiler/'],
        feed:      [],
        errorPage: ['symfony', 'Symfony', 'sf-toolbar'],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      // ─── Enterprise CMS ─────────────────────────────────────────────────
      pimcore: {
        paths:     ['/admin/login', '/pimcore-admin/'],
        headers:   ['x-pimcore-output-timestamp'],
        poweredBy: ['Pimcore'],
        meta:      ['Pimcore'],
        html:      ['pimcore', '/static6/img/', 'pimcore_editable', '/bundles/pimcoreadmin/'],
        scripts:   ['/bundles/pimcore/'],
        links:     [],
        cookies:   ['pimcore_admin_sid'],
        jsVars:    ['pimcore'],
        htmlAttrs: ['data-pimcore-', 'class="pimcore_'],
        robots:    ['/pimcore/', '/bundles/pimcore/'],
        feed:      [],
        errorPage: ['pimcore'],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      neos: {
        paths:     ['/neos/login', '/neos/backend/'],
        headers:   [],
        poweredBy: ['Neos'],
        meta:      ['Neos CMS', 'Neos'],
        html:      ['typo3/neos', 'Neos.Neos:', 'neosContentModule'],
        scripts:   ['/Packages/Sites/'],
        links:     [],
        cookies:   [],
        jsVars:    ['neos'],
        htmlAttrs: ['data-neos-', 'class="neos-'],
        robots:    ['/neos/', '/Packages/'],
        feed:      [],
        errorPage: ['Neos'],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      craftcms: {
        paths:     ['/index.php?p=admin', '/cpresources/'],
        headers:   [],
        poweredBy: [],
        meta:      [],
        html:      ['csrfTokenName', 'craftcms', '/cpresources/', 'window.Craft'],
        scripts:   ['/cpresources/'],
        links:     [],
        cookies:   ['CraftSessionId', 'CRAFT_CSRF_TOKEN'],
        jsVars:    ['window.Craft', 'Craft.csrfTokenName'],
        htmlAttrs: ['data-craft-', 'class="craft-'],
        robots:    ['/cpresources/', 'craft'],
        feed:      ['Craft CMS', 'craftcms'],
        errorPage: ['Craft', 'cpresources'],
        faviconHashes: [],
        versionPatterns: [
          { regex: /Craft CMS ([\d.]+)/i, label: 'Craft version string' },
        ],
        negates:   []
      },

      sitecore: {
        paths:     ['/sitecore/login', '/sitecore/shell/'],
        headers:   ['x-sitecore-instancename', 'x-sitecore-content-length'],
        poweredBy: ['Sitecore'],
        meta:      ['Sitecore'],
        html:      ['sitecore', '/sitecore/shell/', '/sitecore/client/', 'scID'],
        scripts:   ['/sitecore/shell/'],
        links:     [],
        cookies:   ['SC_ANALYTICS_GLOBAL_COOKIE', 'sitecore_'],
        jsVars:    ['Sitecore', 'Sitecore.PageModes'],
        htmlAttrs: ['sc-placeholder'],
        robots:    ['/sitecore/', '/sitecore/shell/'],
        feed:      [],
        errorPage: ['Sitecore'],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      },

      mono: {
        paths:     [],
        headers:   [],
        poweredBy: [],
        meta:      ['Mono'],
        html:      ['__msi___'],
        scripts:   [],
        links:     [],
        cookies:   ['mono_donottrack'],
        jsVars:    [],
        htmlAttrs: [],
        robots:    [],
        feed:      [],
        errorPage: [],
        faviconHashes: [],
        versionPatterns: [],
        negates:   []
      }
    };

    // ─── Gewichtung pro Erkennungskanal ──────────────────────────────────
    this.weights = {
      dns:         70,  // CNAME-Match ist sehr stark
      meta:        60,
      header:      55,
      poweredBy:   55,
      cookie:      45,
      path:        40,
      favicon:     40,
      feed:        35,
      jsVar:       35,
      cdnSignal:   30,  // CDN-Domain-Signal (Option 8)
      htmlAttr:    30,
      robots:      25,
      script:      25,
      errorPage:   20,
      link:        20,
      html:        15
    };

    this.multiChannelBonus = 30;

    // Favicon-Hashes (MD5 der rohen Bytes) – nach Tests befüllen
    this.faviconHashes = {
      'e6f328b4c722fc1c1db3e3de2f8c274e': 'wordpress',
      '4f97169b7af5c5fc7e58b3bc5da59168': 'joomla',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════

  async detect(domain) {
    const results = {
      domain,
      url:          null,
      detectedCMS:  [],
      confidence:   {},
      details:      {},
      version:      {},
      responseTime: null
    };

    try {
      const url = this.normalizeURL(domain);
      const hostname = new URLParser(url).hostname;

      const t0 = Date.now();

      // DNS-Check + Hauptseiten-Fetch parallel starten
      const [response, dnsM] = await Promise.all([
        this.fetchWithRedirects(url),
        this.checkDNS(hostname),            // STUFE 2 – läuft parallel
      ]);

      results.responseTime = Date.now() - t0;
      results.url = response.finalUrl;

      // Alle anderen Checks (inkl. neue CDN-Signal-Methode)
      const [
        headerM, metaM, htmlM, scriptM, linkM, cookieM, jsVarM,
        pathM, htmlAttrM, robotsM, faviconM, feedM, errorPageM,
        cdnM
      ] = await Promise.all([
        Promise.resolve(this.checkHeaders(response.headers)),
        Promise.resolve(this.checkMetaTags(response.body)),
        Promise.resolve(this.checkHTML(response.body)),
        Promise.resolve(this.checkScriptTags(response.body)),
        Promise.resolve(this.checkLinkTags(response.body)),
        Promise.resolve(this.checkCookies(response.headers)),
        Promise.resolve(this.checkJSVars(response.body)),
        this.checkPaths(response.finalUrl),
        Promise.resolve(this.checkHtmlAttributes(response.body)),
        this.checkRobotsTxt(response.finalUrl),
        this.checkFavicon(response.finalUrl),
        this.checkFeed(response.finalUrl),
        this.checkErrorPage(response.finalUrl),
        Promise.resolve(this.checkCDNSignals(response.body)),  // STUFE 1 – Option 8
      ]);

      const merged  = this.mergeResults(
        dnsM, headerM, metaM, htmlM, scriptM, linkM, cookieM, jsVarM,
        pathM, htmlAttrM, robotsM, faviconM, feedM, errorPageM, cdnM
      );
      const negated = this.applyNegativeIndicators(merged);

      results.detectedCMS = negated.cms;
      results.confidence  = negated.confidence;
      results.details     = negated.details;

      // STUFE 3 – erweiterte Versionsextraktion (Option 9)
      results.version = this.extractVersions(response.body, response.headers, feedM);

    } catch (error) {
      results.error = error.message;
    }

    return results;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // URL / FETCH
  // ═══════════════════════════════════════════════════════════════════════

  normalizeURL(domain) {
    const d = domain.trim();
    return (!d.startsWith('http://') && !d.startsWith('https://')) ? `https://${d}` : d;
  }

  fetchWithRedirects(url, maxHops = 5) {
    return new Promise(async (resolve, reject) => {
      let currentUrl = url;
      for (let hop = 0; hop < maxHops; hop++) {
        try {
          const result = await this._fetchOnce(currentUrl);
          if ([301, 302, 303, 307, 308].includes(result.statusCode) && result.headers.location) {
            currentUrl = new URLParser(result.headers.location, currentUrl).toString();
            continue;
          }
          result.finalUrl = currentUrl;
          return resolve(result);
        } catch (err) {
          if (currentUrl.startsWith('http://')) { currentUrl = currentUrl.replace('http://', 'https://'); continue; }
          return reject(err);
        }
      }
      reject(new Error('Too many redirects'));
    });
  }

  _fetchOnce(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URLParser(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      const reqOptions = {
        method: options.method || 'GET',
        headers: options.headers || {
          'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'identity',
          'Connection':      'keep-alive'
        },
        timeout: options.timeout || 10000
      };

      const req = client.request(url, reqOptions, (res) => {
        if (options.binary) {
          const chunks = [];
          res.on('data', c => chunks.push(c));
          res.on('end', () => resolve({ headers: res.headers, body: Buffer.concat(chunks), statusCode: res.statusCode }));
        } else {
          let body = '';
          res.on('data', chunk => { body += chunk; if (body.length > 600000) req.destroy(); });
          res.on('end', () => resolve({ headers: res.headers, body, statusCode: res.statusCode }));
        }
      });

      req.setTimeout(reqOptions.timeout, () => { req.destroy(); reject(new Error('Request timeout')); });
      req.on('error', reject);
      req.end();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STUFE 2 – DNS/CNAME-Check (Option 6)
  // ═══════════════════════════════════════════════════════════════════════

  async checkDNS(hostname) {
    const matches = {};
    try {
      // CNAME auflösen; schlägt fehl wenn kein CNAME (A-Record) → still ignorieren
      const addresses = await dns.resolveCname(hostname).catch(() => []);

      if (addresses.length === 0) return matches;

      const cname = addresses[0].toLowerCase();

      for (const [cms, fp] of Object.entries(this.dnsFingerprints)) {
        for (const pattern of (fp.cname || [])) {
          if (cname.includes(pattern.toLowerCase())) {
            matches[cms] = {
              score:    this.weights.dns,
              found:    [`CNAME: ${addresses[0]} → matches ${pattern}`],
              channels: new Set(['dns'])
            };
            break;
          }
        }
      }
    } catch { /* DNS nicht auflösbar – kein Fehler */ }
    return matches;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STUFE 1 – CDN-Domain-Signals (Option 8)
  // ═══════════════════════════════════════════════════════════════════════

  checkCDNSignals(html) {
    const matches = {};

    // Alle externen URLs aus src/href/url() extrahieren
    const urlPatterns = [
      /(?:src|href)=["']([^"']+)["']/gi,
      /url\(['"]?([^'")\s]+)['"]?\)/gi,
    ];

    const externalUrls = new Set();
    for (const pattern of urlPatterns) {
      let m;
      pattern.lastIndex = 0;
      while ((m = pattern.exec(html)) !== null) {
        const u = m[1].toLowerCase();
        // Nur externe URLs (mit Domain) berücksichtigen
        if (u.startsWith('http') || u.startsWith('//')) externalUrls.add(u);
      }
    }

    const urlString = [...externalUrls].join(' ');

    for (const [cms, domains] of Object.entries(this.cdnSignals)) {
      let score = 0;
      const found = [];
      for (const domain of domains) {
        if (urlString.includes(domain.toLowerCase())) {
          score += this.weights.cdnSignal;
          found.push(`CDN domain: ${domain}`);
        }
      }
      // Mindestens 1 CDN-Treffer reicht – CDN-Domains sind sehr spezifisch
      if (score > 0) {
        matches[cms] = { score, found, channels: new Set(['cdnSignal']) };
      }
    }
    return matches;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // BESTEHENDE ERKENNUNGSMETHODEN (unverändert aus v3)
  // ═══════════════════════════════════════════════════════════════════════

  checkHeaders(headers) {
    const matches = {};
    for (const [cms, sig] of Object.entries(this.signatures)) {
      let score = 0; const found = [];
      for (const key of sig.headers) {
        if (headers[key.toLowerCase()] !== undefined) { score += this.weights.header; found.push(`HTTP Header: ${key}`); }
      }
      for (const pattern of sig.poweredBy) {
        const val = (headers['x-powered-by'] || '').toLowerCase();
        const srv = (headers['server'] || '').toLowerCase();
        if (val.includes(pattern.toLowerCase()) || srv.includes(pattern.toLowerCase())) {
          score += this.weights.poweredBy; found.push(`X-Powered-By / Server: ${pattern}`);
        }
      }
      if (score > 0) matches[cms] = { score, found, channels: new Set(['header']) };
    }
    return matches;
  }

  checkMetaTags(html) {
    const matches = {};
    const regex = /<meta[^>]*name=["']generator["'][^>]*content=["']([^"']*)["'][^>]*>/gi;
    let m;
    while ((m = regex.exec(html)) !== null) {
      const generator = m[1];
      for (const [cms, sig] of Object.entries(this.signatures)) {
        for (const pattern of sig.meta) {
          if (generator.toLowerCase().includes(pattern.toLowerCase())) {
            if (!matches[cms]) matches[cms] = { score: 0, found: [], channels: new Set() };
            matches[cms].score += this.weights.meta;
            matches[cms].found.push(`Meta Generator: ${generator}`);
            matches[cms].channels.add('meta');
          }
        }
      }
    }
    return matches;
  }

  checkHTML(html) {
    const matches = {};
    const htmlLower = html.toLowerCase();
    for (const [cms, sig] of Object.entries(this.signatures)) {
      let score = 0; const found = []; let count = 0;
      for (const pattern of sig.html) {
        if (htmlLower.includes(pattern.toLowerCase())) { count++; found.push(`HTML pattern: ${pattern}`); }
      }
      if (cms === 'mono' && count >= 1) score = count * this.weights.html;
      else if (count >= 2) score = count * this.weights.html + (count >= 4 ? 20 : count >= 3 ? 10 : 0);
      if (score > 0) matches[cms] = { score, found, channels: new Set(['html']) };
    }
    return matches;
  }

  checkScriptTags(html) {
    const matches = {};
    const srcRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const srcs = []; let m;
    while ((m = srcRegex.exec(html)) !== null) srcs.push(m[1].toLowerCase());
    for (const [cms, sig] of Object.entries(this.signatures)) {
      let score = 0; const found = [];
      for (const pattern of sig.scripts || []) {
        if (srcs.some(s => s.includes(pattern.toLowerCase()))) { score += this.weights.script; found.push(`Script src: ${pattern}`); }
      }
      if (score > 0) matches[cms] = { score, found, channels: new Set(['script']) };
    }
    return matches;
  }

  checkLinkTags(html) {
    const matches = {};
    const hrefRegex = /<link[^>]+href=["']([^"']+)["'][^>]*>/gi;
    const hrefs = []; let m;
    while ((m = hrefRegex.exec(html)) !== null) hrefs.push(m[1].toLowerCase());
    for (const [cms, sig] of Object.entries(this.signatures)) {
      let score = 0; const found = [];
      for (const pattern of sig.links || []) {
        if (hrefs.some(h => h.includes(pattern.toLowerCase()))) { score += this.weights.link; found.push(`Link href: ${pattern}`); }
      }
      if (score > 0) matches[cms] = { score, found, channels: new Set(['link']) };
    }
    return matches;
  }

  checkCookies(headers) {
    const matches = {};
    const raw = headers['set-cookie'];
    if (!raw) return matches;
    const cookies = (Array.isArray(raw) ? raw.join('; ') : raw).toLowerCase();
    for (const [cms, sig] of Object.entries(this.signatures)) {
      let score = 0; const found = [];
      for (const pattern of sig.cookies || []) {
        if (cookies.includes(pattern.toLowerCase())) { score += this.weights.cookie; found.push(`Cookie: ${pattern}`); }
      }
      if (score > 0) matches[cms] = { score, found, channels: new Set(['cookie']) };
    }
    return matches;
  }

  checkJSVars(html) {
    const matches = {};
    const htmlLower = html.toLowerCase();
    for (const [cms, sig] of Object.entries(this.signatures)) {
      let score = 0; const found = [];
      for (const v of sig.jsVars || []) {
        if (htmlLower.includes(v.toLowerCase())) { score += this.weights.jsVar; found.push(`JS variable: ${v}`); }
      }
      if (score > 0) matches[cms] = { score, found, channels: new Set(['jsVar']) };
    }
    return matches;
  }

  async checkPaths(baseUrl) {
    const matches = {};
    const checks = [];
    for (const [cms, sig] of Object.entries(this.signatures)) {
      for (const path of sig.paths || []) checks.push({ cms, path });
    }
    const results = await this._parallelLimit(
      checks.map(({ cms, path }) => async () => {
        try {
          return (await this.pathExists(new URLParser(path, baseUrl).toString())) ? { cms, path } : null;
        } catch { return null; }
      }), 8
    );
    for (const r of results.filter(Boolean)) {
      if (!matches[r.cms]) matches[r.cms] = { score: 0, found: [], channels: new Set() };
      matches[r.cms].score += this.weights.path;
      matches[r.cms].found.push(`Path exists: ${r.path}`);
      matches[r.cms].channels.add('path');
    }
    return matches;
  }

  pathExists(url) {
    return new Promise((resolve) => {
      const urlObj = new URLParser(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      const req = client.request(url, { method: 'HEAD', timeout: 4000 }, (res) => {
        resolve([200, 403, 301, 302].includes(res.statusCode));
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    });
  }

  checkHtmlAttributes(html) {
    const matches = {};
    const htmlTagMatch = html.match(/<html[^>]*>/i);
    if (!htmlTagMatch) return matches;
    const htmlTag = htmlTagMatch[0].toLowerCase();
    for (const [cms, sig] of Object.entries(this.signatures)) {
      let score = 0; const found = [];
      for (const attr of sig.htmlAttrs || []) {
        if (htmlTag.includes(attr.toLowerCase())) { score += this.weights.htmlAttr; found.push(`HTML attr: ${attr}`); }
      }
      if (score > 0) matches[cms] = { score, found, channels: new Set(['htmlAttr']) };
    }
    return matches;
  }

  async checkRobotsTxt(baseUrl) {
    const matches = {};
    let content = '';
    try {
      const [r, s] = await Promise.all([
        this._fetchOnce(new URLParser('/robots.txt',  baseUrl).toString(), { timeout: 5000 }).catch(() => null),
        this._fetchOnce(new URLParser('/sitemap.xml', baseUrl).toString(), { timeout: 5000 }).catch(() => null),
      ]);
      if (r && r.statusCode === 200) content += r.body;
      if (s && s.statusCode === 200) content += s.body;
    } catch { return matches; }
    if (!content) return matches;
    const lower = content.toLowerCase();
    for (const [cms, sig] of Object.entries(this.signatures)) {
      let score = 0; const found = [];
      for (const pattern of sig.robots || []) {
        if (lower.includes(pattern.toLowerCase())) { score += this.weights.robots; found.push(`robots.txt/sitemap: ${pattern}`); }
      }
      if (score >= this.weights.robots * 2) matches[cms] = { score, found, channels: new Set(['robots']) };
    }
    return matches;
  }

  async checkFavicon(baseUrl) {
    const matches = {};
    for (const path of ['/favicon.ico', '/favicon.png']) {
      try {
        const res = await this._fetchOnce(new URLParser(path, baseUrl).toString(), {
          binary: true, timeout: 5000,
          headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' }
        });
        if (res.statusCode !== 200 || !res.body || res.body.length < 10) continue;
        const hash = crypto.createHash('md5').update(res.body).digest('hex');
        if (this.faviconHashes[hash]) {
          const cms = this.faviconHashes[hash];
          matches[cms] = { score: this.weights.favicon, found: [`Favicon hash: ${hash}`], channels: new Set(['favicon']) };
          break;
        }
        for (const [cms, sig] of Object.entries(this.signatures)) {
          if ((sig.faviconHashes || []).includes(hash)) {
            matches[cms] = { score: this.weights.favicon, found: [`Favicon hash matched: ${hash}`], channels: new Set(['favicon']) };
          }
        }
        break;
      } catch { continue; }
    }
    return matches;
  }

  async checkFeed(baseUrl) {
    const matches = {};
    let feedContent = '';
    for (const path of ['/feed/', '/feed', '/rss.xml', '/atom.xml', '/rss', '/?feed=rss2', '/blog/feed/']) {
      try {
        const res = await this._fetchOnce(new URLParser(path, baseUrl).toString(), {
          timeout: 5000,
          headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/rss+xml,application/xml,text/xml,*/*' }
        });
        if (res.statusCode === 200 && res.body && res.body.length > 100) { feedContent = res.body; break; }
      } catch { continue; }
    }
    if (!feedContent) return matches;
    const lower = feedContent.toLowerCase();
    const generatorMatch = feedContent.match(/<generator[^>]*>([^<]+)<\/generator>/i) || feedContent.match(/<generator[^>]*\/>/i);
    const generatorText = generatorMatch ? generatorMatch[0].toLowerCase() : '';
    for (const [cms, sig] of Object.entries(this.signatures)) {
      let score = 0; const found = [];
      if (generatorText) {
        for (const p of sig.feed || []) {
          if (generatorText.includes(p.toLowerCase())) { score += this.weights.feed * 2; found.push(`Feed generator: ${p}`); }
        }
      }
      if (score === 0) {
        for (const p of sig.feed || []) {
          if (lower.includes(p.toLowerCase())) { score += this.weights.feed; found.push(`Feed content: ${p}`); }
        }
      }
      if (score > 0) matches[cms] = { score, found, channels: new Set(['feed']) };
    }
    matches._feedGeneratorRaw = generatorMatch ? generatorMatch[0] : null;
    return matches;
  }

  async checkErrorPage(baseUrl) {
    const matches = {};
    try {
      const res = await this._fetchOnce(new URLParser('/cms-probe-nonexistent-xyz-12345', baseUrl).toString(), { timeout: 6000 });
      if (res.statusCode !== 404) return matches;
      const lower = res.body.toLowerCase();
      for (const [cms, sig] of Object.entries(this.signatures)) {
        let count = 0; const found = [];
        for (const p of sig.errorPage || []) {
          if (lower.includes(p.toLowerCase())) { count++; found.push(`404 page: ${p}`); }
        }
        if (count >= 2) matches[cms] = { score: count * this.weights.errorPage, found, channels: new Set(['errorPage']) };
      }
    } catch { return matches; }
    return matches;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STUFE 3 – Erweiterte Versionsextraktion (Option 9)
  // ═══════════════════════════════════════════════════════════════════════

  extractVersions(html, headers, feedMatches) {
    const versions = {};

    // 1. Signature-spezifische Regex-Patterns pro CMS
    for (const [cms, sig] of Object.entries(this.signatures)) {
      for (const { regex } of sig.versionPatterns || []) {
        const m = html.match(regex);
        if (m && m[1]) { versions[cms] = m[1]; break; }
      }
    }

    // 2. Meta-Generator generisch (Fallback)
    const metaRegex = /<meta[^>]*name=["']generator["'][^>]*content=["']([^"']*)["'][^>]*>/gi;
    let m;
    while ((m = metaRegex.exec(html)) !== null) {
      const gen = m[1];
      const verMatch = gen.match(/(\d+\.\d+[\.\d]*)/);
      if (verMatch) {
        const cmsName = gen.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
        if (!versions[cmsName]) versions[cmsName] = verMatch[1];
      }
    }

    // 3. Feed-Generator mit Version
    const feedRaw = feedMatches?._feedGeneratorRaw;
    if (feedRaw) {
      const vM = feedRaw.match(/(\d+\.\d+[\.\d]*)/);
      if (vM) {
        const g = feedRaw.toLowerCase();
        if (g.includes('wordpress') && !versions.wordpress) versions.wordpress = vM[1];
        if (g.includes('ghost')     && !versions.ghost)     versions.ghost     = vM[1];
        if (g.includes('hugo')      && !versions.hugo)      versions.hugo      = vM[1];
        if (g.includes('jekyll')    && !versions.jekyll)    versions.jekyll    = vM[1];
      }
    }

    // 4. X-Powered-By / Server Header
    for (const hdr of ['x-powered-by', 'server']) {
      const val = headers[hdr] || '';
      const hM = val.match(/^(\w[\w.-]+)\/([\d.]+)/);
      if (hM && !versions[hM[1].toLowerCase()]) versions[hM[1].toLowerCase()] = hM[2];
    }

    // 5. Inline-Kommentare mit Versionsnummern (z.B. Ghost, TYPO3, Hugo)
    const commentRegex = /<!--[^>]*(WordPress|Ghost|Drupal|TYPO3|Joomla|Hugo|Jekyll|Eleventy)[^>]*?([\d]+\.[\d]+\.?[\d]*)[^>]*-->/gi;
    let cM;
    while ((cM = commentRegex.exec(html)) !== null) {
      const key = cM[1].toLowerCase();
      if (!versions[key]) versions[key] = cM[2];
    }

    return versions;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SCORING & MERGING
  // ═══════════════════════════════════════════════════════════════════════

  mergeResults(...matchArrays) {
    const combined = {};
    for (const matches of matchArrays) {
      if (!matches || typeof matches !== 'object') continue;
      for (const [cms, data] of Object.entries(matches)) {
        if (cms.startsWith('_')) continue;
        if (!combined[cms]) combined[cms] = { score: 0, found: [], channels: new Set() };
        combined[cms].score += data.score;
        combined[cms].found.push(...data.found);
        for (const ch of (data.channels || [])) combined[cms].channels.add(ch);
      }
    }
    for (const [, data] of Object.entries(combined)) {
      const n = data.channels.size;
      if (n >= 4) data.score += this.multiChannelBonus * 3;
      else if (n >= 3) data.score += this.multiChannelBonus * 2;
      else if (n >= 2) data.score += this.multiChannelBonus;
    }
    const sorted = Object.entries(combined).filter(([, d]) => d.score > 0).sort((a, b) => b[1].score - a[1].score);
    return {
      cms:        sorted.map(([cms]) => cms),
      confidence: Object.fromEntries(sorted.map(([cms, d]) => [cms, this.calculateConfidence(d.score, d.channels.size)])),
      details:    Object.fromEntries(sorted.map(([cms, d]) => [cms, { score: d.score, found: d.found, channels: [...d.channels] }]))
    };
  }

  applyNegativeIndicators(merged) {
    const toRemove = new Set();
    for (const cms of merged.cms) {
      for (const neg of (this.signatures[cms]?.negates || [])) {
        if (merged.details[neg] && merged.details[cms] &&
            merged.details[cms].score / merged.details[neg].score > 3) {
          toRemove.add(neg);
        }
      }
    }
    const filtered = merged.cms.filter(c => !toRemove.has(c));
    return {
      cms:        filtered,
      confidence: Object.fromEntries(filtered.map(c => [c, merged.confidence[c]])),
      details:    Object.fromEntries(filtered.map(c => [c, merged.details[c]]))
    };
  }

  calculateConfidence(score, channels = 1) {
    if (score >= 140 || (score >= 90  && channels >= 4)) return 'high';
    if (score >= 70  || (score >= 50  && channels >= 3)) return 'high';  // DNS allein reicht für high
    if (score >= 45  || (score >= 30  && channels >= 2)) return 'medium';
    return 'low';
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════

  async _parallelLimit(tasks, limit) {
    const results = []; let idx = 0;
    async function worker() { while (idx < tasks.length) { const i = idx++; results[i] = await tasks[i](); } }
    await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
    return results;
  }
}

module.exports = CMSDetector;
