import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import {
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  ResponsiveContainer,
} from 'recharts';
import EmptyChart from './EmptyChart';
import {
  getActionsByDay,
  formatActionsByDay,
  filterActionsByUser,
  findYAxisMax,
} from '../../../utils/api';
import { CONTAINER_HEIGHT } from '../../../config/constants';

const useStyles = makeStyles(() => ({
  typography: { textAlign: 'center' },
}));

const ActionsByDayChart = ({ actions, view, allUsers, usersToFilter }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const classes = useStyles();

  // actionsByDay is the object passed, after formatting, to the BarChart component below
  // if you remove all names in the react-select dropdown, usersToFilter becomes null
  // if no users are selected (i.e. usersToFilter.length === 0), show all actions
  // if all users are selected (i.e. usersToFilter.length === allUsers.length), also show all actions
  // third condition above is necessary: some actions are made by users NOT in the users list (e.g. user account deleted)
  // e.g. we retrieve 100 total actions and 10 users, but these 10 users have only made 90 actions
  // therefore, to avoid confusion: when all users are selected, show all actions
  let actionsByDay;
  if (
    usersToFilter === null ||
    usersToFilter.length === 0 ||
    usersToFilter.length === allUsers.length
  ) {
    actionsByDay = getActionsByDay(actions, view);
  } else {
    actionsByDay = getActionsByDay(
      filterActionsByUser(actions, usersToFilter, view),
      view,
    );
  }

  const yAxisMax = findYAxisMax(actionsByDay);
  const formattedActionsByDay = formatActionsByDay(actionsByDay);

  // if selected user(s) have no actions, render component with message that there are no actions
  if (formattedActionsByDay.length === 0) {
    return (
      <EmptyChart
        usersToFilter={usersToFilter}
        chartTitle={t('Actions by Day')}
      />
    );
  }

  return (
    <>
      <Typography variant="h6" className={classes.typography}>
        {t('Actions by Day')}
      </Typography>
      <ResponsiveContainer width="95%" height={CONTAINER_HEIGHT}>
        <BarChart
          data={formattedActionsByDay}
          margin={{ top: 30, bottom: 20, left: 20, right: 20 }}
        >
          <CartesianGrid strokeDasharray="2" />
          <XAxis dataKey="date" tick={{ fontSize: 14 }} />
          <YAxis tick={{ fontSize: 14 }} domain={[0, yAxisMax]} />
          <Tooltip />
          <Bar
            dataKey="count"
            name={t('Count')}
            fill={theme.palette.primary.main}
          />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
};

ActionsByDayChart.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.object).isRequired,
  view: PropTypes.string.isRequired,
  allUsers: PropTypes.arrayOf(PropTypes.object).isRequired,
  usersToFilter: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default ActionsByDayChart;
