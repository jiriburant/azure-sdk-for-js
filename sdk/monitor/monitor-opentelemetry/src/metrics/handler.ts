// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AzureMonitorMetricExporter } from "@azure/monitor-opentelemetry-exporter";
import { metrics } from "@opentelemetry/api";
import {
  MeterProvider,
  MeterProviderOptions,
  PeriodicExportingMetricReader,
  PeriodicExportingMetricReaderOptions,
} from "@opentelemetry/sdk-metrics";
import { InternalConfig } from "../shared/config";
import { StandardMetrics } from "./standardMetrics";
import { ReadableSpan, Span } from "@opentelemetry/sdk-trace-base";
import { LogRecord } from "@opentelemetry/sdk-logs";
import { APPLICATION_INSIGHTS_NO_STANDARD_METRICS } from "./types";

/**
 * Azure Monitor OpenTelemetry Metric Handler
 */
export class MetricHandler {
  private static _instance: MetricHandler;
  private _collectionInterval = 60000; // 60 seconds
  private _meterProvider: MeterProvider;
  private _azureExporter: AzureMonitorMetricExporter;
  private _metricReader: PeriodicExportingMetricReader;
  private _standardMetrics?: StandardMetrics;
  private _config: InternalConfig;

  public static getInstance(config: InternalConfig, options?: { collectionInterval: number }) {
    if (!MetricHandler._instance) {
      MetricHandler._instance = new MetricHandler(config, options);
    }
    return MetricHandler._instance;
  }

  /**
   * Initializes a new instance of the MetricHandler class.
   * @param config - Distro configuration.
   * @param options - Metric Handler options.
   */
  constructor(config: InternalConfig, options?: { collectionInterval: number }) {
    this._config = config;
    if (!process.env[APPLICATION_INSIGHTS_NO_STANDARD_METRICS]) {
      this._standardMetrics = new StandardMetrics(this._config);
    }
    const meterProviderConfig: MeterProviderOptions = {
      resource: this._config.resource,
    };
    this._meterProvider = new MeterProvider(meterProviderConfig);
    this._azureExporter = new AzureMonitorMetricExporter(this._config.azureMonitorExporterConfig);
    let metricReaderOptions: PeriodicExportingMetricReaderOptions = {
      exporter: this._azureExporter as any,
      exportIntervalMillis: options?.collectionInterval || this._collectionInterval,
    };
    this._metricReader = new PeriodicExportingMetricReader(metricReaderOptions);
    this._meterProvider.addMetricReader(this._metricReader);
    metrics.setGlobalMeterProvider(this._meterProvider);
  }

  public markSpanAsProcessed(span: Span): void {
    this._standardMetrics?.markSpanAsProcessed(span);
  }

  public recordSpan(span: ReadableSpan): void {
    this._standardMetrics?.recordSpan(span);
  }

  public recordLog(logRecord: LogRecord): void {
    this._standardMetrics?.recordLog(logRecord);
  }

  /**
   * Shutdown handler, all Meter providers will return no-op Meters
   */
  public async shutdown(): Promise<void> {
    this._meterProvider.shutdown();
    this._standardMetrics?.shutdown();
  }

  /**
   * Force flush all Meter Providers
   */
  public async flush(): Promise<void> {
    await this._meterProvider.forceFlush();
    await this._standardMetrics?.flush();
  }
}
