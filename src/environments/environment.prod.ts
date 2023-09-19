// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`. 

export const environment = {
  production: true,
  baseUrl: 'https://wpservices.wearablesclinicaltrials.com/wearables',
  gcpStoragePath: 'https://storage.googleapis.com/pr-wearables-portal-media-prod/PROD/GCloud/WPortal/',
  baseUrl2: '',
  grantType: 'password',
  clientId: 'adminClientId',
  clientSecret: 'wearablesAdmin',
  tokenString: 'userToken',
  userId: 'userId',
  refreshTokenString: 'userRefreshToken',
  firebase: {
    apiKey: "",
    authDomain: "ct-wearables-portal-prod.firebaseapp.com",
    projectId: "ct-wearables-portal-prod",
    storageBucket: "ct-wearables-portal-prod.appspot.com"
  },


  //questionnaire variables
  otherSpecifyText: 'Other, Specify',
  noneOfTheAboveText: 'None of the above',

  //customer service report
  customerSupportDashboardReportUrl: 'https://lookerstudio.google.com/embed/reporting/3e607679-92b6-4df3-80f4-0d86a0d265dd/page/p_lyo2u07t4c',

  //prelude config order
  preludeMandatoryFields: ["External Patient ID", "Pet Name", "Breed", "Pet Parent Last Name", "Pet Parent Email", "Secondary Email", "Baseline Start Date", "Baseline End Date", "Treatment Start Date", "Treatment End Date", "Study Group", "Address Line 1", "City", "State", "Zipcode"]
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
