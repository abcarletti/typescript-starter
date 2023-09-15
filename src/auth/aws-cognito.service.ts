import { Injectable } from '@nestjs/common';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
} from 'amazon-cognito-identity-js';
import { AuthChangePasswordUserDto } from './dtos/auth-change-password-user.dto';
import { AuthLoginUserDto } from './dtos/auth-login-user.dto';
import { AuthRegisterUserDto } from './dtos/auth-register-user.dto';

import { AuthConfirmPasswordUserDto } from './dtos/auth-confirm-password-user.dto';
import { AuthForgotPasswordUserDto } from './dtos/auth-forgot-password-user.dto';

@Injectable()
export class AwsCognitoService {
  private userPool: CognitoUserPool;

  constructor() {
    console.log(
      'AWS_COGNITO_USER_POOL_ID',
      process.env.AWS_COGNITO_USER_POOL_ID,
    );
    console.log('AWS_COGNITO_CLIENT_ID', process.env.AWS_COGNITO_CLIENT_ID);
    this.userPool = new CognitoUserPool({
      UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
      ClientId: process.env.AWS_COGNITO_CLIENT_ID,
    });
    console.log('this.userPool', this.userPool, 5);
  }

  async registerUser(authRegisterUserDto: AuthRegisterUserDto) {
    const {
      name,
      email,
      password,
      given_name,
      family_name,
      picture,
      gender,
      birthdate,
      zoneinfo,
      locale,
      updated_at,
    } = authRegisterUserDto;

    return new Promise((resolve, reject) => {
      this.userPool.signUp(
        email,
        password,
        [
          new CognitoUserAttribute({
            Name: 'name',
            Value: name,
          }),
          new CognitoUserAttribute({
            Name: 'given_name',
            Value: given_name,
          }),
          new CognitoUserAttribute({
            Name: 'family_name',
            Value: family_name,
          }),
          new CognitoUserAttribute({
            Name: 'picture',
            Value: picture,
          }),
          new CognitoUserAttribute({
            Name: 'gender',
            Value: gender,
          }),
          new CognitoUserAttribute({
            Name: 'birthdate',
            Value: birthdate,
          }),
          new CognitoUserAttribute({
            Name: 'zoneinfo',
            Value: zoneinfo,
          }),
          new CognitoUserAttribute({
            Name: 'locale',
            Value: locale,
          }),
          new CognitoUserAttribute({
            Name: 'updated_at',
            Value: updated_at,
          }),
        ],
        null,
        (err, result) => {
          console.log('err', err);
          console.log('result', result);
          if (!result) {
            reject(err);
          } else {
            resolve(result.user);
          }
        },
      );
    });
  }

  async authenticateUser(authLoginUserDto: AuthLoginUserDto) {
    const { email, password } = authLoginUserDto;
    const userData = {
      Username: email,
      Pool: this.userPool,
    };

    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const userCognito = new CognitoUser(userData);

    return new Promise((resolve, reject) => {
      userCognito.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          resolve({
            accessToken: result.getAccessToken().getJwtToken(),
            refreshToken: result.getRefreshToken().getToken(),
          });
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  }

  async changeUserPassword(
    authChangePasswordUserDto: AuthChangePasswordUserDto,
  ) {
    const { email, currentPassword, newPassword } = authChangePasswordUserDto;

    const userData = {
      Username: email,
      Pool: this.userPool,
    };

    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: currentPassword,
    });

    const userCognito = new CognitoUser(userData);

    return new Promise((resolve, reject) => {
      userCognito.authenticateUser(authenticationDetails, {
        onSuccess: () => {
          userCognito.changePassword(
            currentPassword,
            newPassword,
            (err, result) => {
              if (err) {
                reject(err);
                return;
              }
              resolve(result);
            },
          );
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  }

  async forgotUserPassword(
    authForgotPasswordUserDto: AuthForgotPasswordUserDto,
  ) {
    const { email } = authForgotPasswordUserDto;

    const userData = {
      Username: email,
      Pool: this.userPool,
    };

    const userCognito = new CognitoUser(userData);

    return new Promise((resolve, reject) => {
      userCognito.forgotPassword({
        onSuccess: (result) => {
          resolve(result);
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  }

  async confirmUserPassword(
    authConfirmPasswordUserDto: AuthConfirmPasswordUserDto,
  ) {
    const { email, confirmationCode, newPassword } = authConfirmPasswordUserDto;

    const userData = {
      Username: email,
      Pool: this.userPool,
    };

    const userCognito = new CognitoUser(userData);

    return new Promise((resolve, reject) => {
      userCognito.confirmPassword(confirmationCode, newPassword, {
        onSuccess: () => {
          resolve({ status: 'success' });
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  }
}
