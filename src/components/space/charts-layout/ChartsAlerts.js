import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import Tooltip from '@material-ui/core/Tooltip';
import { Info } from '@material-ui/icons';
import { useTranslation } from 'react-i18next';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  alert: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
}));

const AlertsTooltip = withStyles({
  tooltip: {
    fontSize: '11px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    marginRight: '1em',
  },
})(Tooltip);

const ChartsAlerts = ({ metadata, view }) => {
  const { t } = useTranslation();
  const classes = useStyles();
  const {
    maxTreeLength,
    maxTreeLengthExceeded,
    requestedSampleSize,
    numActionsRetrieved,
  } = metadata;

  const displayWarningMessage = () => {
    if (numActionsRetrieved === 0) {
      return (
        <Alert severity="warning" className={classes.alert}>
          {t('This space and its subspaces do not have any actions yet.', {
            view,
          })}
        </Alert>
      );
    }
    if (maxTreeLengthExceeded) {
      return (
        <Alert
          severity="warning"
          className={classes.alert}
          action={
            // adding a tooltip to an Alert is tricky; this hack uses the Alert's built-in 'action' prop to do this
            // doing so creates a conflict between eslint and prettier on using () around JSX; thus the disable below
            // eslint-disable-next-line react/jsx-wrap-multilines
            <AlertsTooltip
              title={t(
                'By default, the number of subspaces retrieved and sampled in the charts below is capped.',
                { maxTreeLength },
              )}
              placement="left"
            >
              <Info fontSize="small" />
            </AlertsTooltip>
          }
        >
          {t(
            'This space has more than the maximum subspaces allowed. The data below is sampled from the maximum number of retrieved subspaces.',
            { maxTreeLength },
          )}
        </Alert>
      );
    }
    return null;
  };

  const displaySampleInfo = () => {
    if (numActionsRetrieved !== 0) {
      return (
        <Alert
          severity="info"
          className={classes.alert}
          action={
            // adding a tooltip to an Alert is tricky; this hack uses the Alert's built-in 'action' prop to do this
            // doing so creates a conflict between eslint and prettier on using () around JSX; thus the disable below
            // eslint-disable-next-line react/jsx-wrap-multilines
            <AlertsTooltip
              title={t(
                'By default, only a sample of actions is requested and displayed in the charts below, in order to provide a general overview of activity in this space and its subspaces.',
                { requestedSampleSize },
              )}
              placement="left"
            >
              <Info fontSize="small" />
            </AlertsTooltip>
          }
        >
          {t(
            'The charts below display a sample of actions from this space and its nested subspaces.',
            {
              view,
              numActionsRetrieved,
              requestedSampleSize,
            },
          )}
        </Alert>
      );
    }
    return null;
  };

  return (
    <div className={classes.root}>
      {displayWarningMessage()}
      {displaySampleInfo()}
    </div>
  );
};

ChartsAlerts.propTypes = {
  metadata: PropTypes.shape({
    numSpacesRetrieved: PropTypes.number.isRequired,
    maxTreeLength: PropTypes.number.isRequired,
    maxTreeLengthExceeded: PropTypes.bool.isRequired,
    requestedSampleSize: PropTypes.number.isRequired,
    numActionsRetrieved: PropTypes.number.isRequired,
  }).isRequired,
  view: PropTypes.string.isRequired,
};

export default ChartsAlerts;
