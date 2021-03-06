// Functions in this file manipulate data retrieved from the api to make it usable by the app's charts/components
const _ = require('lodash');
const {
  LEARNING_ANALYTICS_USER_ID,
  MIN_PERCENTAGE_TO_SHOW_VERB,
  OTHER_VERB,
  LATE_NIGHT,
  EARLY_MORNING,
  MORNING,
  AFTERNOON,
  EVENING,
  NIGHT,
  PERFORM_VIEW_STRING,
  COMPOSE_VIEW_STRING,
  ACCESSED_STRING,
  TOP_NUMBER_OF_ITEMS_TO_DISPLAY,
} = require('../config/constants');

// Takes array of action objects and returns an object with {key: value} pairs of {date: #-of-actions}
export const getActionsByDay = (actions, view) => {
  const dateKey = view === COMPOSE_VIEW_STRING ? 'published' : 'createdAt';
  const actionsByDay = {};
  actions.forEach((action) => {
    const actionDate = new Date(action[dateKey].slice(0, 10));
    if (!actionsByDay[actionDate]) {
      actionsByDay[actionDate] = 1;
    } else {
      actionsByDay[actionDate] += 1;
    }
  });
  return actionsByDay;
};

// Takes object with {key: value} pairs of {date: #-of-actions} and returns a date-sorted array in Recharts.js format
export const formatActionsByDay = (actionsByDayObject) => {
  const actionsByDayArray = Object.entries(actionsByDayObject);
  const sortedActionsByDay = actionsByDayArray.sort(
    (entryA, entryB) => Date.parse(entryA[0]) - Date.parse(entryB[0]),
  );
  return sortedActionsByDay.map((entry) => {
    const entryDate = new Date(entry[0]);
    return {
      date: `${entryDate.getDate()}-${
        entryDate.getMonth() + 1
      }-${entryDate.getFullYear()}`,
      count: entry[1],
    };
  });
};

export const mapActionsToGeoJsonFeatureObjects = (actions, view) => {
  if (view === PERFORM_VIEW_STRING) {
    return actions
      .filter((action) => action.geolocation)
      .map((action) => ({
        type: 'Feature',
        properties: { cluster: false, actionId: action._id },
        geometry: {
          type: 'Point',
          coordinates: [action.geolocation.ll[1], action.geolocation.ll[0]],
        },
      }));
  }
  return actions
    .filter((action) => action.context)
    .filter((action) => action.context.location)
    .map((action) => ({
      type: 'Feature',
      properties: { cluster: false, actionId: action._id },
      geometry: {
        type: 'Point',
        coordinates: [action.context.location.lon, action.context.location.lat],
      },
    }));
};

// helper function used in getActionsByTimeOfDay below
// todo: update this function to retrieve hour of day using JS Date objects/moment
const getActionHourOfDay = (action, view) => {
  const dateKey = view === COMPOSE_VIEW_STRING ? 'published' : 'createdAt';
  // if view === 'compose', expects action to be an object with a published key
  // if view === 'perform', expects action to be an object with a createdAt key
  // published/createdAt should have the format "2020-12-31T23:59:59.999Z"
  return action[dateKey].slice(11, 13);
};

// Takes array of action objects and returns an object with {key: value} pairs of {hourOfDay: #-of-actions}
export const getActionsByTimeOfDay = (actions, view) => {
  const actionsByTimeOfDay = {
    [LATE_NIGHT]: 0,
    [EARLY_MORNING]: 0,
    [MORNING]: 0,
    [AFTERNOON]: 0,
    [EVENING]: 0,
    [NIGHT]: 0,
  };
  actions.forEach((action) => {
    const actionHourOfDay = getActionHourOfDay(action, view);
    if (actionHourOfDay >= 0 && actionHourOfDay < 4) {
      actionsByTimeOfDay[LATE_NIGHT] += 1;
    } else if (actionHourOfDay >= 4 && actionHourOfDay < 8) {
      actionsByTimeOfDay[EARLY_MORNING] += 1;
    } else if (actionHourOfDay >= 8 && actionHourOfDay < 12) {
      actionsByTimeOfDay[MORNING] += 1;
    } else if (actionHourOfDay >= 12 && actionHourOfDay < 16) {
      actionsByTimeOfDay[AFTERNOON] += 1;
    } else if (actionHourOfDay >= 16 && actionHourOfDay < 20) {
      actionsByTimeOfDay[EVENING] += 1;
    } else if (actionHourOfDay >= 20 && actionHourOfDay < 24) {
      actionsByTimeOfDay[NIGHT] += 1;
    } else {
      // eslint-disable-next-line no-console
      console.log(`actionHourOfDay ${actionHourOfDay} is undefined`);
    }
  });
  return actionsByTimeOfDay;
};

// Takes object with {key: value} pairs of {timeOfDay: #-of-actions}
// returns a date-sorted array in Recharts.js format
export const formatActionsByTimeOfDay = (actionsByTimeOfDayObject) => {
  const actionsByTimeOfDayArray = Object.entries(actionsByTimeOfDayObject);
  return actionsByTimeOfDayArray.map((entry) => {
    return {
      timeOfDay: entry[0],
      count: entry[1],
    };
  });
};

// Takes array of action objects and returns an object with {key: value} pairs of {verb: %-of-actions}
export const getActionsByVerb = (actions) => {
  const totalActions = actions.length;
  const actionsByVerb = {};
  actions.forEach((action) => {
    if (!actionsByVerb[action.verb]) {
      // if verb is still not in the actionsByVerb object, add it and assign it to (1 / totalActions)
      // we use (1 / totalActions) because in the end we want this object to be {verb: PERCENTAGE-of-total-actions}
      actionsByVerb[action.verb] = 1 / totalActions;
    } else {
      actionsByVerb[action.verb] += 1 / totalActions;
    }
  });
  return actionsByVerb;
};

export const formatActionsByVerb = (actionsByVerbObject) => {
  const actionsByVerbArray = Object.entries(actionsByVerbObject);

  // capitalize verbs (entry[0][0]), convert 0.0x notation to x% and round to two decimal places (entry[0][1])
  const formattedActionsByVerbArray = actionsByVerbArray
    .map((entry) => [
      _.capitalize(entry[0]),
      parseFloat((entry[1] * 100).toFixed(2)),
    ])
    .filter((entry) => entry[1] >= MIN_PERCENTAGE_TO_SHOW_VERB);

  // add ['other', x%] to cover all verbs that are filtered out of the array
  if (formattedActionsByVerbArray.length) {
    formattedActionsByVerbArray.push([
      OTHER_VERB,
      // ensure that it is a number with two decimal places
      parseFloat(
        (
          100 -
          formattedActionsByVerbArray.reduce(
            (acc, current) => acc + current[1],
            0,
          )
        ).toFixed(2),
      ),
    ]);
  }

  // convert to recharts required format
  return formattedActionsByVerbArray.map((entry) => {
    return {
      verb: entry[0],
      percentage: entry[1],
    };
  });
};

// 'usersArray' has the form [ { ids: [1, 2], name: 'Augie March', type: 'light', value: 'Augie March'}, {...}, ... ]
// i.e. a user (identified by their name) can have multiple ids (due to different sign-in sesions)
// 'actions' is an array in the format retrieved from the API: [ { id: 1, user: 2, ... }, {...} ]
// therefore note: id is the id of the action, and user is the userId of the user performing the action
export const filterActionsByUser = (actions, usersArray, view) => {
  const userKey = view === COMPOSE_VIEW_STRING ? 'actorUser' : 'user';
  return actions.filter((action) => {
    return usersArray.some((user) => {
      return user.ids.includes(action[userKey]);
    });
  });
};

// given an actionsByDay object, findYAxisMax finds max value to set on the yAxis in the graph in ActionsByDayChart.js
export const findYAxisMax = (actionsByDay) => {
  const arrayOfActionsCount = Object.values(actionsByDay);
  if (!arrayOfActionsCount.length) {
    return null;
  }
  const maxActionsCount = arrayOfActionsCount.reduce((a, b) => Math.max(a, b));
  let yAxisMax;
  // if maxActionsCount <= 100, round up yAxisMax to the nearest ten; else, to the nearest hundred
  if (maxActionsCount <= 100) {
    yAxisMax = Math.ceil(maxActionsCount / 10) * 10;
  } else {
    yAxisMax = Math.ceil(maxActionsCount / 100) * 100;
  }
  return yAxisMax;
};

// Extract main space name
export const extractMainSpace = (arrayOfSpaceObjects) => {
  return arrayOfSpaceObjects.filter((space) => space.parentId === null)[0];
};

// Extract main space *immediate* children
export const extractMainSpaceChildren = (arrayOfSpaceObjects) => {
  const mainSpaceId = extractMainSpace(arrayOfSpaceObjects).id;
  return arrayOfSpaceObjects.filter((space) => space.parentId === mainSpaceId);
};

// remove user 'Learning Analytics' from users list retrieved by API
// this is an auto-generated 'user' that we don't want to display in the application
export const removeLearningAnalyticsUser = (usersArray) => {
  return usersArray.filter((user) => user._id !== LEARNING_ANALYTICS_USER_ID);
};

// consolidate users with the same name into a single entry
// instead of users = [{id: 1, name: 'Augie March'}, {id: 2, name: 'augie march'}], users = [{ids: [1,2], name: 'augie march'}]
export const consolidateUsers = (usersArray) => {
  // remove trailing spaces from user names and turn them lower case
  const usersArrayWithTrimmedNames = usersArray.map((user) => {
    return { ...user, name: user.name.trim().toLowerCase() };
  });

  // group ids of matching user names under one object
  const consolidatedUsersArray = [];
  usersArrayWithTrimmedNames.forEach((user) => {
    const userIndex = consolidatedUsersArray.findIndex(
      (arrayUser) => arrayUser.name === user.name,
    );
    // if user doesn't exist in consolidatedUsersArray, push that user into the array
    if (userIndex === -1) {
      consolidatedUsersArray.push({
        ids: [user._id],
        name: user.name,
        type: user.type,
      });
    }
    // if user *does* exist in consolidatedUsersArray, push current user's id to that user's ids array
    else {
      consolidatedUsersArray[userIndex].ids.push(user._id);
    }
  });
  return consolidatedUsersArray;
};

// for presentation purposes, format user names, then sort them alphabetically
// proper names are recapitalized ('Augie March'), and only the first letter of emails is capitalized
export const formatConsolidatedUsers = (consolidatedUsersArray) => {
  const usersArrayCapitalized = consolidatedUsersArray.map((user) => {
    // if user name includes @ symbol, only capitalize first letter
    if (user.name.indexOf('@') !== -1) {
      return {
        ...user,
        name: _.capitalize(user.name),
      };
    }
    // otherwise, reg exp below capitalizes first letter of each part of a user's space-delimited name
    return {
      ...user,
      name: user.name.replace(/\b(\w)/g, (char) => char.toUpperCase()),
    };
  });
  // return alphbatically sorted array of users
  return _.sortBy(usersArrayCapitalized, (user) => user.name);
};

// for react-select purposes, add a 'value' key to each element of the users array, holding the same value as the key 'name'
export const addValueKeyToUsers = (consolidatedUsersArray) => {
  return consolidatedUsersArray.map((user) => {
    return { ...user, value: user.name };
  });
};

// takes array of action objects and array of itemTypes (e.g. ['Space', 'Resource'])
// keeps only actions with verb 'accessed'
// returns an array of objects {displayName, count, category} (corresponding to format required by Recharts)
export const getItemsByAccessedCount = (actions, itemTypes) => {
  let filteredActions;
  // when app is initially loaded, selected itemTypes (taken from the Select dropdown in the Most Viewed Items chart) is empty
  // in this case, we want to show all actions (with the verb 'accessed')
  if (!itemTypes || itemTypes.length === 0) {
    filteredActions = actions.filter(
      (action) => action.verb === ACCESSED_STRING,
    );
  }
  // otherwise, filter actions by selected item types
  else {
    filteredActions = actions.filter(
      (action) =>
        action.verb === ACCESSED_STRING &&
        itemTypes.includes(action.target.objectType),
    );
  }
  // determine the number of actions for each item type, keeping note of the item type (objectType/category)
  let itemsCount = [];
  filteredActions.forEach((action) => {
    const { displayName, objectType } = action.target;
    const displayNameIndex = itemsCount.findIndex(
      (item) => item.displayName === displayName,
    );
    if (displayNameIndex === -1) {
      itemsCount.push({ displayName, count: 1, category: objectType });
    } else {
      itemsCount = [
        ...itemsCount.slice(0, displayNameIndex),
        {
          ...itemsCount[displayNameIndex],
          count: itemsCount[displayNameIndex].count + 1,
        },
        ...itemsCount.slice(displayNameIndex + 1),
      ];
    }
  });
  return itemsCount;
};

// Takes array of objects {displayName, count, category} and returns a sorted array with only top items
export const formatItemsByAccessedCount = (itemsCount) => {
  const sortedItemsCountArray = itemsCount.sort(
    (itemA, itemB) => itemB.count - itemA.count,
  );
  // keep only top ten entries
  // reverse so that in the chart the most frequent item appears on the right
  const slicedItemsCountArray = sortedItemsCountArray
    .slice(0, TOP_NUMBER_OF_ITEMS_TO_DISPLAY)
    .reverse();
  return slicedItemsCountArray;
};

export const extractItemTypes = (actions) => {
  const filteredActions = actions.filter(
    (action) => action.verb === ACCESSED_STRING,
  );
  const items = [];
  filteredActions.forEach((action) => {
    const { objectType } = action.target;
    if (items.indexOf(objectType) === -1) {
      items.push(objectType);
    }
  });
  const itemsReactSelect = [];
  items.forEach((item) => itemsReactSelect.push({ name: item, value: item }));
  return itemsReactSelect;
};
