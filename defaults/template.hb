<!DOCTYPE HTML>

<html>
{{#each cssTrace}}
  <link rel="stylesheet" type="text/css" href="{{{this}}}"></link>
{{/each}}

  <head>
    <title> {{{meta.title}}} </title>
  </head>

{{#if meta.bodyClass}}
  <body class="{{{meta.bodyClass}}}">
{{else}}
  <body>
{{/if}}
    <div id="__zygo-container__">
      {{{component}}}
    </div>

    <script src="/jspm_packages/system.js"></script>
    <script src="/config.js"></script>
    {{#each visibleBundles}}
    <script src="{{{this}}}.js"></script>
    {{/each}}

    <script>
      System.baseURL = "{{{baseURL}}}";

      System.import("zygo").then(function(zygo) {
    {{#if bundles}}
        zygo._setBundles({{{bundles}}});
    {{/if}}

        zygo._setContext({{{context}}});
        zygo._setRoutes({{{routes}}});
        zygo._setCurrentRoutes({{{matchedRoutes}}});

    {{#if addLinkHandlers}}
        zygo._addLinkHandlers();
    {{/if}}

        zygo.setVisibleBundles(zygo.currentRoutes);
        zygo._deserializeContext(zygo.currentRoutes);
        zygo.setMetadata();
        zygo.refresh();
      });
    </script>
  </body>
</html>
