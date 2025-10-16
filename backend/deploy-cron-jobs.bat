@echo off
REM Deploy ChartedArt Background Jobs (Cron) to AWS EventBridge
REM Prerequisites: AWS CLI configured, SAM deployed

echo Deploying ChartedArt Background Jobs...

SET STACK_NAME=chartedart-backend-dev
SET REGION=us-east-1

echo Fetching Lambda function ARNs...

FOR /F "tokens=*" %%i IN ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --region %REGION% --query "Stacks[0].Outputs[?OutputKey=='CronCalculateEngagementFunctionArn'].OutputValue" --output text') DO SET ENGAGEMENT_FUNCTION_ARN=%%i

FOR /F "tokens=*" %%i IN ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --region %REGION% --query "Stacks[0].Outputs[?OutputKey=='CronCleanupPuzzleReservationsFunctionArn'].OutputValue" --output text') DO SET CLEANUP_FUNCTION_ARN=%%i

IF "%ENGAGEMENT_FUNCTION_ARN%"=="" (
    echo Error: Could not find Lambda function ARNs. Make sure SAM is deployed.
    exit /b 1
)

echo Found Lambda functions:
echo   - Engagement: %ENGAGEMENT_FUNCTION_ARN%
echo   - Cleanup: %CLEANUP_FUNCTION_ARN%

echo Creating EventBridge rule: Calculate Engagement (every 10 min)...

FOR /F "tokens=*" %%i IN ('aws events put-rule --name chartedart-calculate-engagement --description "Calculate movement engagement scores every 10 minutes" --schedule-expression "rate(10 minutes)" --state ENABLED --region %REGION% --query RuleArn --output text') DO SET ENGAGEMENT_RULE_ARN=%%i

aws lambda add-permission --function-name %ENGAGEMENT_FUNCTION_ARN% --statement-id AllowEventBridgeInvoke-Engagement --action lambda:InvokeFunction --principal events.amazonaws.com --source-arn %ENGAGEMENT_RULE_ARN% --region %REGION% 2>nul

aws events put-targets --rule chartedart-calculate-engagement --targets "Id=1,Arn=%ENGAGEMENT_FUNCTION_ARN%" --region %REGION%

echo Engagement rule created and enabled

echo Creating EventBridge rule: Cleanup Reservations (every 5 min)...

FOR /F "tokens=*" %%i IN ('aws events put-rule --name chartedart-cleanup-reservations --description "Cleanup expired puzzle piece reservations every 5 minutes" --schedule-expression "rate(5 minutes)" --state ENABLED --region %REGION% --query RuleArn --output text') DO SET CLEANUP_RULE_ARN=%%i

aws lambda add-permission --function-name %CLEANUP_FUNCTION_ARN% --statement-id AllowEventBridgeInvoke-Cleanup --action lambda:InvokeFunction --principal events.amazonaws.com --source-arn %CLEANUP_RULE_ARN% --region %REGION% 2>nul

aws events put-targets --rule chartedart-cleanup-reservations --targets "Id=1,Arn=%CLEANUP_FUNCTION_ARN%" --region %REGION%

echo Cleanup rule created and enabled
echo.
echo Background jobs deployed successfully!
echo.
echo Cron Schedule:
echo   - Calculate Engagement: Every 10 minutes
echo   - Cleanup Reservations: Every 5 minutes
echo.
echo Monitor logs with:
echo   aws logs tail /aws/lambda/chartedart-cron-calculate-engagement --follow
echo   aws logs tail /aws/lambda/chartedart-cron-cleanup-reservations --follow
echo.
