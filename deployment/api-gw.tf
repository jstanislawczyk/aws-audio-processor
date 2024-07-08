resource "aws_apigatewayv2_api" "api" {
  name          = "${local.project}-api"
  description   = "Audio Processor API"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "api_stage" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "${local.project}-api"
  auto_deploy = true
}

resource "aws_apigatewayv2_integration" "upload_url_generator_integration" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_uri        = aws_lambda_function.upload_url_generator.invoke_arn
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "upload_url_generator_route" {
  api_id             = aws_apigatewayv2_api.api.id
  route_key          = "GET /api/upload/url"
  target             = "integrations/${aws_apigatewayv2_integration.upload_url_generator_integration.id}"
  authorization_type = "NONE"
}
