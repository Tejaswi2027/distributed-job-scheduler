type LogMetadata = Record<string, any> | Error | unknown;

class Logger {
  private format(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, context?: string, meta?: LogMetadata) {
    const logObject: Record<string, any> = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context }),
    };

    if (meta) {
      if (meta instanceof Error) {
        logObject.error = {
          name: meta.name,
          message: meta.message,
          stack: meta.stack,
        };
      } else {
        logObject.meta = meta;
      }
    }

    return JSON.stringify(logObject);
  }

  info(message: string, context?: string, meta?: LogMetadata) {
    console.log(this.format('INFO', message, context, meta));
  }

  warn(message: string, context?: string, meta?: LogMetadata) {
    console.warn(this.format('WARN', message, context, meta));
  }

  error(message: string, context?: string, meta?: LogMetadata) {
    console.error(this.format('ERROR', message, context, meta));
  }

  debug(message: string, context?: string, meta?: LogMetadata) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this.format('DEBUG', message, context, meta));
    }
  }
}

export const logger = new Logger();
