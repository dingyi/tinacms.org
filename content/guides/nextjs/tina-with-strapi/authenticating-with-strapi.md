---
title: 'Authenticating with Strapi'
---

@TODO: imports

Before we can implement an editing experience, we need to set up an authentication experience. To do this, we'll be running through setting up credentials through Strapi.

## Using Next.js Preview Mode

If we're authenticated, we're going to display the pages to the user using [Next.js' Preview Mode](https://nextjs.org/docs/advanced-features/preview-mode) and display an editing interface to the user.

First, we're going to create two API's: one to set `previewData` when we're authenticated, and one to clear `previewData` when we want to unauthenticate..

Create a file called `pages/api/preview.js` and give it the following content.

**pages/api/preview.js**

```js
import { STRAPI_JWT } from 'react-tinacms-strapi-bm-test'
const previewHandler = (req, res) => {
  const previewData = {
    strapi_jwt: req.cookies[STRAPI_JWT],
  }

  res.setPreviewData(previewData)
  res.status(200).end()
}

export default previewHandler
```

Upon authenticating, Strapi will pass us a JWT. We store this JWT in `previewData` from where we will pull it anytime we want to call a Strapi API.

Create another file called `pages/api/reset-preview.ts` and give it the following content.

**pages/api/reset-preview.js**

```js
export default (_req, res) => {
  res.clearPreviewData()
  res.status(200).end()
}
```

Whenever we call this API, we will clear the preview data, and the user will become unauthenticated.

## Modify Strapi's Authenticated Role

In the previous step you gave **Public** users read-access. Now we want to give edit access to **Authenticated** users. Head back to [Roles & Permissions](http://localhost:1337/admin/plugins/users-permissions/roles) in Strapi and click on the **Authenticated** role.

To keep things simple, we'll give **Authenticated** users full permissions on **Authors** and **Blog Posts**. Click **Select All** on both of these types and click **Save**.

Additionally we want these users to be able to upload images to use as a `coverImage`. Click on the **UPLOAD** header on this page and give the role the **upload** permission. Again, click **Save**.

While we're here, let's also set up a user with the **Authenticated** role. Head over to [Users->Add New User](http://localhost:1337/admin/plugins/content-manager/collectionType/plugins::users-permissions.user/create?redirectUrl=/plugins/content-manager/collectionType/plugins::users-permissions.user). Give them a **Username**, **Email**, **Password**, and set the **Confirmed** toggle to "ON". Give them the **Authenticated** role and then hit the **Save** button.

## Setup a Simple Authentication Interface

Head into `pages/_app.js`. We're going to add a button to our pages that will pop-up a window asking for authentication and then put us into preview mode if everything goes well.

First we'll enable or disable Tina based on whether we're in preview mode.

```diff
  const cms = new TinaCMS({
    sidebar: { hidden: true },
    apis: {
      strapi: new TinaStrapiClient(),
    },
    media: {
      store: new StrapiMediaStore(),
    },
  });

+ pageProps.preview ? cms.enable() : cms.disable();
```

Next, we need to create functions that let our Strapi provider know what we want to do when authenticating/unauthenticating. Add the following two methods to the bottom of `_app.js`..

```js
const enterEditMode = () => {
  return fetch(`/api/preview`).then(() => {
    window.location.href = window.location.pathname
  })
}

const exitEditMode = () => {
  return fetch(`/api/reset-preview`).then(() => {
    window.location.reload()
  })
}
```

Pass these two functions into the Strapi provider, and give Strapi knowledge of whether or not we're in preview mode.

```diff
      <StrapiProvider
-       editMode={false}
+       editMode={pageProps.preview}
-       enterEditMode={() => {}}
+       enterEditMode={enterEditMode}
-       exitEditMode={() => {}}
+       exitEditMode={exitEditMode}
      >
        <Component {...pageProps} />
      </StrapiProvider>
```

Now the Strapi provider knows to call our two API functions whenever authentication is successful.

Finally, we'll go ahead and actually create a button that will let us enter/exit editing mode. Create a new component:

```js
export const EditButton = ({ editMode }) => {
  const strapi = useStrapiEditing()
  return (
    <button onClick={editMode ? strapi.exitEditMode : strapi.enterEditMode}>
      {editMode ? 'Stop Editing' : 'Edit This Site'}
    </button>
  )
}
```

For simplicity, we'll just have that button be displayed at the top of every page.

```diff
  return (
    <TinaProvider cms={cms}>
      <StrapiProvider
        editMode={pageProps.preview}
        enterEditMode={enterEditMode}
        exitEditMode={exitEditMode}
      >
+       <EditButton editMode={pageProps.preview} />
        <Component {...pageProps} />
      </StrapiProvider>
    </TinaProvider>
  );
```

Now go into our index page and make a quick change to `getStaticProps`. Change the signature so that it accepts a `preview` flag and so that we'll have access to `previewData`..

```diff
- export async function getStaticProps() {
+ export async function getStaticProps({ params, preview, previewData }) {

  // ...

+ if (preview) {
+   return {
+     props: { allPosts: postResults.data.blogPosts, preview, ...previewData },
+   };
+ }

  return {
    props: { allPosts: postResults.data.blogPosts },
  };
```

@TODO: The Modal is extremely janky.

You can now refresh your index page and should see a link that says "Edit This Site". Clicking on it will bring up a login screen. Log in with the credentials you created earlier. You should see it switch to say "Stop Editing". .

We also need our blog post pages to use `preview` and `previewData`. So exactly as we did for the index, go into `[slug].js` and add in the followingg

```diff
- export async function getStaticProps({ params }) {
+ export async function getStaticProps({ params, preview, previewData }) {

  // ...
+ if (preview) {
+   return {
+     props: {
+       post: {
+         ...post,
+         content,
+         rawMarkdownBody: post.content,
+       },
+       preview,
+       ...previewData,
+     },
+   };
+ }

  return {
    props: {
      post: {
        ...post,
        content,
        rawMarkdownBody: post.content,
      },
    },
  };
```

With this taken care of, we can move onto adding an editing experience to our blog posts.