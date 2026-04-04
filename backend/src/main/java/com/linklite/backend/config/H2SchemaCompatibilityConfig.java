package com.linklite.backend.config;

import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class H2SchemaCompatibilityConfig {

    private static final Logger logger = LoggerFactory.getLogger(H2SchemaCompatibilityConfig.class);

    @Bean
    ApplicationRunner h2EnumCompatibilityRunner(DataSource dataSource) {
        return args -> {
            try (var connection = dataSource.getConnection()) {
                String productName = connection.getMetaData().getDatabaseProductName();
                if (!"H2".equalsIgnoreCase(productName)) {
                    return;
                }
            } catch (Exception exception) {
                logger.warn("Unable to determine database type for enum compatibility migration", exception);
                return;
            }

            JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
            convertEnumColumnToVarchar(jdbcTemplate, "accounts", "role", "VARCHAR(32)");
            convertEnumColumnToVarchar(jdbcTemplate, "accounts", "status", "VARCHAR(32)");
            convertEnumColumnToVarchar(jdbcTemplate, "otp_tokens", "purpose", "VARCHAR(32)");
        };
    }

    private void convertEnumColumnToVarchar(JdbcTemplate jdbcTemplate, String tableName, String columnName, String targetType) {
        try {
            jdbcTemplate.execute("ALTER TABLE " + tableName + " ALTER COLUMN " + columnName + " " + targetType);
        } catch (Exception primaryException) {
            try {
                jdbcTemplate.execute("ALTER TABLE " + tableName + " ALTER COLUMN " + columnName + " SET DATA TYPE " + targetType);
            } catch (Exception secondaryException) {
                logger.debug(
                    "Skipping compatibility migration for {}.{} because the column could not be altered",
                    tableName,
                    columnName,
                    secondaryException
                );
            }
        }
    }
}
