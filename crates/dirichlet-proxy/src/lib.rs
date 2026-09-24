//! Dirichlet Edge Security Service
//!

pub mod config;
pub mod engine;

pub use config::ProxyConfig;
pub use engine::feature_ingest::{
    ingest_features_gracefully, Feature, IngestionReport, MAX_ACTIVE_FEATURES,
};
pub use engine::metrics::PrometheusMetrics;
pub use engine::traffic_evaluator::{
    EvaluationVerdict, MitigationAction, RequestSignals, TrafficEvaluator,
};

/// Baseline unpatched ingestion function.
///
/// Demonstrates the naive assumption that dynamic payloads never exceed the
/// static capacity of 200 features. For inputs <= 200, pads up to 200 items.
/// For oversized payloads (> 200 items), the slice conversion fails and
/// panics with TryFromSliceError.
pub fn ingest_features_baseline(features: &[Feature]) -> [Feature; 200] {
    let padded: Vec<Feature> = if features.len() <= MAX_ACTIVE_FEATURES {
        let mut v = Vec::with_capacity(MAX_ACTIVE_FEATURES);
        v.extend_from_slice(features);
        v.resize(MAX_ACTIVE_FEATURES, Feature::default());
        v
    } else {
        features.to_vec()
    };

    let slice_ref: &[Feature; 200] = padded.as_slice().try_into().unwrap();
    slice_ref.clone()
}
