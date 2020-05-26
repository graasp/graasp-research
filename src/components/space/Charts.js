import React, { useContext } from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import ChartsHeader from './ChartsHeader';
import ActionsChart from './ActionsChart';
import ActionsMap from './ActionsMap';
import { SpaceDataContext } from './SpaceDataProvider';

function Charts() {
  const { actions, error, isLoading } = useContext(SpaceDataContext);
  if (isLoading) {
    return (
      <div>
        <Typography>Loading...</Typography>
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <Typography>{error}</Typography>
      </div>
    );
  }
  if (!isLoading && actions.length === 0) {
    return (
      <div>
        <Typography>This space does not have actions yet.</Typography>
      </div>
    );
  }
  return (
    <div>
      <ChartsHeader />
      <Grid container>
        <Grid item xs={12} sm={12} md={6} lg={6} xl={6}>
          <ActionsChart />
        </Grid>
        <Grid item xs={12} sm={12} md={6} lg={6} xl={6}>
          <ActionsMap />
        </Grid>
      </Grid>
    </div>
  );
}

export default Charts;
