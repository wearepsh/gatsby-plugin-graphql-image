const { createRemoteFileNode } = require(`gatsby-source-filesystem`);

exports.createResolvers = async (
  { actions, cache, createNodeId, createResolvers, store, reporter },
  configOptions
) => {
  const { createNode } = actions;

  // Gatsby adds a configOption that's not needed for this plugin, delete it
  delete configOptions.plugins;

  const { images } = configOptions;

  const state = store.getState();

  for (let i = 0; i < images.length; ++i) {
    const { schemaName, typeName, fieldName, baseUrl } = images[i];
    const schema = state.schemaCustomization.thirdPartySchemas.filter(
      s => s._typeMap[schemaName]
    )[0];
    if (!schema) {
      console.warn(`Schema "${schemaName}" does not exist`);
      continue;
    }
    const typeMap = schema._typeMap;
    if (!typeMap[typeName]) {
      console.warn(
        `TypeName "${typeName}" does not exist in schema "${schemaName}"`
      );
      continue;
    }
    const typeEntry = typeMap[typeName];
    const typeFields =
      (typeEntry && typeEntry.getFields && typeEntry.getFields()) || {};
    if (!typeFields[fieldName]) {
      console.warn(`Field "${fieldName}" does not exist on type ${typeName}`);
      continue;
    }

    await createResolvers({
      [typeName]: {
        [`${fieldName}Sharp`]: {
          type: "File",
          async resolve(source) {
            const url = (baseUrl || "") + source[fieldName];
            let image = null;
            if (url) {
              try {
                image = await createRemoteFileNode({
                  url,
                  store,
                  cache,
                  createNode,
                  createNodeId,
                  reporter
                });
              } catch (e) {
                image = null
              }
            }
            return image;
          }
        }
      }
    })
  }
};