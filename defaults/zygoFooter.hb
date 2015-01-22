<script>
System.baseURL = location.href.substr(0, location.href.length - {{{path.length}}});

System.import("zygo").then(function(zygo) {
  zygo._setInitialState({{{state}}});

{{#if bundles}}
  zygo._setBundles({{{bundles}}});
{{#each bundleObjects}}
  System.bundles['{{{this.bundle}}}'] = [{{#each this.modules}}'{{{this}}}',{{/each}}];
{{/each}}
{{/if}}

  zygo._setRoutes({{{routes}}});

{{#if addLinkHandlers}}
  zygo._addLinkHandlers();
{{/if}}

  zygo._emit("deserialize", zygo.state);
  zygo.refresh();
});
</script>
